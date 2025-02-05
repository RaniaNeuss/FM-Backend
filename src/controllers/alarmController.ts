import { Request, Response } from 'express';
import * as alarmstorage from '../runtime/alarms/alarmstorage';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { getAlarmsHistory } from '../runtime/alarms/alarmstorage';




//set alarm


export const setAlarms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const alarms = req.body;

    // Validate projectId and alarms array
    if (!projectId) {
      res.status(400).json({
        error: "validation_error",
        message: "Project ID is required in the URL parameters.",
      });
    }

    if (!alarms || !Array.isArray(alarms)) {
       res.status(400).json({
        error: "validation_error",
        message: "Expected an array of alarms in the request body.",
      });
    }

    console.log("Processing alarms for projectId:", projectId);

    for (const alarm of alarms) {
      // Validate required fields
      const { id, type, tagId, min, max, interval, userAck, groupId, ontime, offtime, acktime, status } = alarm;

      if (!type || !tagId || min == null || max == null || !interval) {
        console.warn(
          `Alarm validation failed: Missing required fields for alarm ${
            id || "new"
          }`
        );
        continue;
      }

      // Check if the tag exists
      const tag = await prisma.tag.findUnique({ where: { id: tagId } });
      if (!tag) {
        console.warn(
          `Tag with id ${tagId} not found. Skipping alarm ${id || "new"}.`
        );
        continue;
      }

      // Check if the group exists, if provided
      if (groupId) {
        const group = await prisma.group.findUnique({ where: { id: groupId } });
        if (!group) {
          console.warn(
            `Group with id ${groupId} not found. Skipping alarm ${id || "new"}.`
          );
          continue;
        }
      }

      // Check if the user exists based on the `username`, if provided
      let user = null;
      if (userAck) {
        user = await prisma.user.findUnique({
          where: { username: userAck },
        });
        if (!user) {
          console.warn(
            `User with username "${userAck}" not found. Skipping alarm ${
              id || "new"
            }.`
          );
          continue;
        }
      }

      // Upsert the alarm (basic data)
      const upsertedAlarm = await prisma.alarm.upsert({
        where: { id: id || "" },
        create: {
          name: alarm.name,
          type,
          tag: { connect: { id: tagId } }, // Associate the alarm with the tag
          min,
          max,
          interval,
          isEnabled: alarm.isEnabled || false,
          project: { connect: { id: projectId } },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          name: alarm.name,
          type,
          tagId,
          min,
          max,
          interval,
          isEnabled: alarm.isEnabled || false,
          updatedAt: new Date(),
        },
      });

      console.log(`Alarm ${upsertedAlarm.id} upserted successfully.`);

      // Insert into alarm history
      await prisma.alarmHistory.create({
        data: {
          alarmId: upsertedAlarm.id,
          type,
          status: status || "inactive",
          group: groupId || "", // Associate the group ID if provided
          text: alarm.message || "",
          onTime: ontime || null,
          offTime: offtime || null,
          ackTime: acktime || null,
          userAck: user ? user.username : "", // Save the username of the user
          createdAt: new Date(), // Use current time for history creation
        },
      });

      console.log(`History for alarm ${upsertedAlarm.id} created successfully.`);
    }

    res.status(200).json({
      success: true,
      message: "Alarms processed successfully.",
    });
  } catch (err: any) {
    console.error(`Error setting alarm: ${err.message}`);
    res.status(500).json({
      error: "unexpected_error",
      message: err.message,
    });
  }
};

  








// Controller: Acknowledge Alarm
export const acknowledgeAlarm = async (req: Request, res: Response): Promise<void> => {
    try {
        const { alarmId } = req.body;
        const userId = req.session.userId;

        // Validate userId
        if (!userId) {
            res.status(400).json({
                error: 'user_not_found',
                message: 'User not found. Please log in to acknowledge alarms.',
            });
            return;
        }

        // Validate alarmId
        if (!alarmId) {
            res.status(400).json({
                error: 'missing_alarm_id',
                message: 'alarmId is required.',
            });
            return;
        }

        console.log(`Acknowledging alarm with alarmId: ${alarmId}, userId: ${userId}`);

        // Acknowledge alarm
        const result = await alarmstorage.setAlarmAck(alarmId, userId);

        if (!result) {
            res.status(200).json({ success: false });
            return;
        }

        res.status(200).json({ success: true });
    } catch (err: any) {
        console.error(`Error acknowledging alarm: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: err.message,
        });
    }
};






// Controller: Clear Alarms


export const clearAlarms = async (req: Request, res: Response): Promise<void> => {
    try {
        const { all } = req.body;

        // Clear alarms using the provided `all` value
        const result = await alarmstorage.clearAlarms(all);

        if (!result) {
            res.status(200).json({ success: false });
            return;
        }

        res.status(200).json({ success: true });
    } catch (err: any) {
        console.error(`Error clearing alarms: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: err.message,
        });
    }
};




export const getAlarmHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        // Parse body parameters
        const from = req.body.from ? parseInt(req.body.from, 10) : 0;
        const to = req.body.to ? parseInt(req.body.to, 10) : Date.now();

        console.log(`Fetching alarm history from ${new Date(from).toISOString()} to ${new Date(to).toISOString()}`);

        // Fetch alarm history using the utility function
        const history = await getAlarmsHistory(from, to);

        res.status(200).json(history);
    } catch (err: any) {
        console.error(`Error fetching alarm history: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: err.message,
        });
    }
};





//fetch all alarms

export const getAllAlarms = async (req: Request, res: Response): Promise<void> => {
    try {
        // Fetch all alarms using alarmstorage.getAlarms
        const alarms = await alarmstorage.getAlarms();

        // Return alarms in response
        res.status(200).json(alarms);
    } catch (err: any) {
        console.error(`Error fetching alarms: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: err.message,
        });
    }
};