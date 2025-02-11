import { Request, Response } from 'express';
import * as alarmstorage from '../runtime/alarms/alarmstorage';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { getAlarmsHistory } from '../runtime/alarms/alarmstorage';




//set alarm


export const setAlarm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const alarm = req.body;

    if (!projectId) {
      res.status(400).json({
        error: "validation_error",
        message: "Project ID is required in the URL parameters.",
      });
    }

    if (!alarm || typeof alarm !== "object") {
      res.status(400).json({
        error: "validation_error",
        message: "Expected an object containing alarm data in the request body.",
      });
    }

    console.log("Processing alarm for projectId:", projectId);

    const { id, name,text, type, tagId, min, max, interval, timeInMinMaxRange, status } = alarm;

    if (!type || !tagId || min == null || max == null || !interval) {
      res.status(400).json({
        error: "validation_error",
        message: "Missing required fields: type, tagId, min, max, interval are mandatory.",
      });
    }

    // Check if the tag exists
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
     res.status(400).json({
        error: "validation_error",
        message: `Tag with id ${tagId} not found.`,
      });
    }

    // 🔹 Fetch all users that belong to groups "SuperAdmin" or "Editor"
    const users = await prisma.user.findMany({
      where: {
        groups: {
          some: {
            name: { in: ["SuperAdmin", "Editor"] } // Only fetch users in these groups
          }
        }
      },
      select: { id: true } // Only fetch user IDs
    });

    if (users.length === 0) {
      res.status(400).json({
        error: "validation_error",
        message: "No users found in groups 'SuperAdmin' or 'Editor'.",
      });
    }

    // Extract user IDs
    const userIds = users.map(user => ({ id: user.id }));

    // 🔹 Upsert the alarm and associate with users
    const upsertedAlarm = await prisma.alarm.upsert({
      where: id ? { id } : { id: "non-existent-id" },
      create: {
        name,
        type,
        text,
        tag: { connect: { id: tagId } },
        min,
        max,
        interval,
        timeInMinMaxRange: timeInMinMaxRange || 0, // Include new field
        isEnabled: alarm.isEnabled || false,
        project: { connect: { id: projectId } },
        users: { connect: userIds } // Connect users to the alarm
      },
      update: {
        name,
        type,
        tagId,
        min,
        max,
        interval,
        timeInMinMaxRange: timeInMinMaxRange || 0, // Include new field
        isEnabled: alarm.isEnabled || false,
        users: { set: userIds } // Update the associated users
      },
    });

    console.log(`Alarm ${upsertedAlarm.id} upserted successfully.`);

    // 🔹 Insert into alarm history
    await prisma.alarmHistory.create({
      data: {
        alarmId: upsertedAlarm.id,
        type,
        status: status || "inactive",
        text: alarm.text || "",
      },
    });

    console.log(`History for alarm ${upsertedAlarm.id} created successfully.`);

    res.status(200).json({
      success: true,
      message: "Alarm processed successfully.",
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
        const userId = req.userId;


        if (!userId) {
            res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
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