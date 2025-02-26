import { PrismaClient, Device, Tag as PrismaTag, Alarm } from '@prisma/client';
import deviceManager from './runtime/devices/deviceManager';
import alarmManager from './runtime/alarms/alarmmanager';

// Reuse a single PrismaClient instance
const basePrisma = new PrismaClient();

interface Tag extends PrismaTag {
  alarms: Alarm[];
}

/**
 * Extended Prisma with middleware that intercepts operations on Device, Tag, Alarm.
 */
const prisma = basePrisma.$extends({
  query: {
    device: {
      /**
       * Intercept all device operations: create, update, delete, etc.
       */
      async $allOperations({ operation, args, query }) {
        console.log(`Intercepted operation on Device: ${operation}`);

        let prevDevice: Device | null = null;

        try {
          if (operation === 'update') {
            const deviceId = args.where?.id;
            if (deviceId) {
              // Fetch old device if you still need it:
              prevDevice = await prisma.device.findUnique({
                where: { id: deviceId },
              });
            } else {
              console.warn(
                'No `id` provided in `where` clause for update operation on device.'
              );
            }
          }

          // Execute the original operation
          const result = await query(args);

          if (operation === 'create') {
            const createdDev = result as Device;
            console.log(`Device created with ID: ${createdDev.id}`);
            if (createdDev.enabled) {
              console.log(
                `Initializing polling for new device '${createdDev.name}'...`
              );
              deviceManager.initializeAndPollDevices([createdDev]);
            }
          } else if (operation === 'delete') {
            const deletedDeviceId = args.where?.id;
            if (deletedDeviceId) {
              console.log(`Device deleted with ID: ${deletedDeviceId}`);
              deviceManager.handleDeviceDeleted(deletedDeviceId);
            }
          } else if (operation === 'update') {
            const updatedDev = result as Device;
            if (prevDevice) {
              console.log(`Device updated with ID: ${updatedDev.id}`);
              deviceManager.handleDeviceUpdated(updatedDev, prevDevice);
            } else {
              console.warn(
                `No previous device state found for update. (ID: ${args.where?.id})`
              );
            }
          }

          return result;
        } catch (err) {
          console.error('Error in Prisma device middleware:', err);
          throw err;
        }
      },
    },

    tag: {
      /**
       * Intercept all tag operations
       */
      async $allOperations({ operation, args, query }) {
        console.log(`📡 Intercepted operation on Tag: ${operation}`);

        // If we're updating a single Tag record, ensure the updated record includes alarms.
        if (operation === 'update') {
          // Extend or create the `args.include` so we get `alarms` in the returned record
          if (!args.include) {
            args.include = { alarms: true };
          } else {
            args.include.alarms = true;
          }
        }

        // Execute the original operation
        const result = await query(args);

        if (operation === 'update') {
          // Because of `args.include = { alarms: true }`, `result` should have the updated Tag with alarms.
          const updatedTag = result as Tag;
          console.log(
            `📌 Tag '${updatedTag.label}' updated with new value: '${updatedTag.value}'`
          );

          // If the updated tag has alarms, re-check them
          if (updatedTag.alarms && updatedTag.alarms.length > 0) {
            // This call triggers the alarm logic (min/max check, etc.)
            alarmManager.updateAlarmsByTag(updatedTag);
          }
        }

        return result;
      },
    },

    alarm: {
      /**
       * Intercept all alarm operations
       */
      async $allOperations({ operation, args, query }) {
        console.log(`Intercepted operation on alarm: ${operation}`);

        let prevAlarm: Alarm | null = null;

        // If "update", fetch the old alarm if you need it
        if (operation === 'update') {
          const alarmId = args.where?.id;
          if (alarmId) {
            prevAlarm = await prisma.alarm.findUnique({ where: { id: alarmId } });
          }
        }

        const result = await query(args);

        try {
          if (operation === 'create') {
            const newAlarm = result as Alarm;
            console.log(`✅ Alarm created with ID: ${newAlarm.id}`);
            alarmManager.addOrUpdateAlarmInMemory(newAlarm);
          } else if (operation === 'update') {
            const updatedAlarm = result as Alarm;
            console.log(`♻ Alarm updated with ID: ${updatedAlarm.id}`);
            alarmManager.addOrUpdateAlarmInMemory(updatedAlarm);
          } else if (operation === 'delete') {
            const deletedAlarmId = args.where?.id;
            if (deletedAlarmId) {
              console.log(`❌ Alarm deleted with ID: ${deletedAlarmId}`);
              alarmManager.removeAlarmInMemory(deletedAlarmId);
            }
          }
        } catch (err) {
          console.error('Error syncing alarm changes to AlarmManager:', err);
        }

        return result;
      },
    },
  },
});

export default prisma;
