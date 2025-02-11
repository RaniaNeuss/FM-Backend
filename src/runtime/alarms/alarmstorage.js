'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
var logger;

/**
 * Initialize the storage module with a logger
 * @param {*} _logger - Application logger
 */
function init(_logger) {
  logger = _logger; // Save the logger instance
}

/**
 * Clear all alarms from the database
 * @param {boolean} all - If true, clears both `alarms` and `AlarmHistory` tables
 */
export async function clearAlarms(all) {
  try {
    await prisma.alarm.deleteMany(); // Clear alarms
    if (all) {
      await prisma.alarmHistory.deleteMany(); // Clear alarm history
    }
    return true;
  } catch (err) {
    logger.error('alarmsstorage.clearAlarms failed: ' + err.message);
    throw new Error('Failed to clear alarms: ' + err.message);
  }
}











/**
 * Acknowledge an alarm
 * @param {string} alarmId - The ID of the alarm
 * @param {string} userId - The ID of the user acknowledging the alarm
 */
export async function setAlarmAck(alarmId, userId) {
  try {
    // Fetch the username from the user ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }, // Only fetch the username
    });

    if (!user) {
      throw new Error(`No user found with ID '${userId}'`);
    }

    // Update the alarm with the username in `userAck`
    const result = await prisma.alarmHistory.updateMany({
      where: {
        id: alarmId,
        acktime: null, // Only check for null values
      },
      data: {
        acktime: new Date(),
        status: 'ACK',
        userAck: user.username, // Set the username instead of user ID
      },
    });

    if (result.count === 0) {
      throw new Error(`No alarm found with ID '${alarmId}' to acknowledge or already acknowledged.`);
    }

    return true;
  } catch (err) {
    const errorMessage = `alarmsstorage.setAlarmAck failed: ${err.message}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}



/**
 * Fetch all active alarms from the database
 */
export async function getAlarms() {
  try {
      const alarms = await prisma.alarm.findMany();
      return alarms;
  } catch (err) {
      logger.error('alarmstorage.getAlarms failed: ' + err.message);
      throw new Error('Failed to fetch alarms: ' + err.message);
  }
}



/**
 * Fetch alarm history within a specific time range
 * @param {number} from - Start time for the range (timestamp in milliseconds)
 * @param {number} to - End time for the range (timestamp in milliseconds)
 * @returns {Promise<Array>} - Returns a promise resolving to the alarm history
 */
export async function getAlarmsHistory(from, to) {
  return new Promise(async (resolve, reject) => {
    try {
      const start = from || 0; // Default to 0 if `from` is not provided
      const end = to || Date.now(); // Default to current timestamp if `to` is not provided

      // Fetch the alarm history from the database using Prisma
      const history = await prisma.alarmHistory.findMany({
        where: {
          onTime: {
            gte: new Date(start),
            lte: new Date(end),
          },
        },
        orderBy: {
          onTime: 'desc',
        },
      });

      // Resolve the promise with the fetched rows
      resolve(history);
    } catch (err) {
      console.error('Error fetching alarm history:', err.message);
      reject(new Error('Failed to fetch alarm history: ' + err.message));
    }
  });
}



/**
 * Add or update alarm records in the database
 * @param {Array} alarms - List of alarms to insert or update
 */
export async function setAlarms(alarms) {
  try {
    for (const alr of alarms) {
      const status = alr.status || '';
      const userAck = alr.userAck || '';

      // Ensure projectId is provided for creating alarms
      if (!alr.projectId) {
        throw new Error(`Project ID is required for alarm: ${JSON.stringify(alr)}`);
      }

      await prisma.alarm.upsert({
        where: { id: alr.id }, // Use `id` directly if `alr.getId()` is undefined
        create: {
          id: alr.id,
          type: alr.type,
          status: status,
          ontime: alr.ontime,
          offtime: alr.offtime,
          acktime: alr.acktime,
          project: {
            connect: {
              id: alr.projectId, // Connect to the existing project using projectId
            },
          },
        },
        update: {
          type: alr.type,
          status: status,
          ontime: alr.ontime,
          offtime: alr.offtime,
          acktime: alr.acktime,
        },
      });

      console.log(`Alarm ${alr.id} upserted successfully.`);

      // Insert into alarm history
      await prisma.alarmHistory.create({
        data: {
          alarmId: alr.id,
          type: alr.type,
          status: status,
          text: alr.subproperty?.text || '',
          onTime: alr.ontime,
          offTime: alr.offtime,
          ackTime: alr.acktime,
          userAck: userAck,
        },
      });

      console.log(`History for alarm ${alr.id} created successfully.`);
    }

    return true;
  } catch (err) {
    console.error('Error in setAlarms:', err);
    throw new Error(`alarmsstorage.setAlarms failed: ${err.message}`);
  }
}


/**
 * Removes an alarm by ID and its associated alarm histories.
 * @param {string} alarmId - The ID of the alarm to be removed.
 * @returns {Promise<void>} Resolves when the alarm and its histories are removed.
 */
export async function removeAlarm(alarmId) {
  try {
    // Delete associated alarm histories
    await prisma.alarmHistory.deleteMany({
      where: { alarmId },
    });

    // Delete the alarm itself
    await prisma.alarm.delete({
      where: { id: alarmId },
    });

    logger.info(`Alarm with ID ${alarmId} removed successfully.`);
  } catch (err) {
    const errorMessage = err?.message || 'Unknown error occurred while removing alarm.';
    logger.error(`Error in removeAlarm: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}









/**
 * Close the Prisma client
 */
export async function close() {
  await prisma.$disconnect();
}

/**
 * Export the module functions
 */
export default {
  init,
  close,
  getAlarms,
  getAlarmsHistory,
  setAlarms,
  clearAlarms,
  removeAlarm,
  setAlarmAck,
};

