import { Request, Response } from 'express';

import * as alarmstorage from '../runtime/alarms/alarmstorage';
import  alarmManager from '../runtime/alarms/alarmmanager';


import prisma from '../prismaClient';


// Alarm Status Enum (Matching Runtime)
const AlarmStatusEnum = {
  VOID: "",
  ON: "N",
  OFF: "NF",
  ACK: "NA",
};


export const setAlarm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      res.status(400).json({
        error: "validation_error",
        message: "Project ID is required in the URL parameters.",
      });
      return;
    }

  
    const {name, type, tagId, isEnabled, status, subproperty, toremove } = req.body;

    if (!type || !tagId || !subproperty) {
      res
        .status(400)
        .json({
          error: "validation_error",
          message: "Type, tagId, and subproperty are required.",
        });
      return;
    }

    // Extract subproperty fields
    const { min, max, ackmode, timedelay, checkdelay, text, group } = subproperty;
    if (min == null || max == null) {
      res.status(400).json({
        error: "validation_error",
        message: "subproperty must include min and max.",
      });
      return;
    }

    // Default ackmode if not given
    if (!subproperty.ackmode) {
      subproperty.ackmode = "float";
    }

    // Check the tag
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      res.status(404).json({
        error: "not_found",
        message: `Tag with id ${tagId} not found.`,
      });
      return;
    }

    // Evaluate the current tag value
    const tagValue = parseFloat(tag.value || "0");
    let initialStatus = tagValue >= min && tagValue <= max ? "N" : "";
    // If alarm is ON, we set an ontime
    let ontime = initialStatus === "N" ? new Date() : null;

    // 1) Upsert the Alarm in the main Alarm table
    const newAlarm = await prisma.alarm.create({
      data: {
        name,
        type,
        tag: { connect: { id: tagId } },
        subproperty: JSON.stringify(subproperty),
        isEnabled: isEnabled ?? false,
        status: initialStatus,
        project: { connect: { id: projectId } },
        ontime,
        
      },
      include: { tag: true },
      
      


    });


    // 2) Now, upsert into AlarmHistory using (alarmId, ontime) as the composite
    // If 'ontime' is null (because it's VOID), we can skip history OR 
    // you might store a placeholder. Up to your logic.
    if (ontime) {
      await prisma.alarmHistory.upsert({
        where: {
          // composite unique index on (alarmId, ontime)
          alarmId_ontime: {
            alarmId: newAlarm.id,
            ontime,
          },
        },
        create: {
          alarmId: newAlarm.id,
          name: name,
          type,
          status: initialStatus,
          text: text || "",
          group: group || "",
          ontime, // new ON cycle
        },
        update: {
          // If it already exists, update status
          status: initialStatus,
          // Note: If you want to mark OFF or ACK, do it in future updates 
          updatedAt: new Date(),
        },
      });
    }

    // 3) If "toremove" is set, remove the alarm from the DB (main alarm table).
    if (toremove) {
      await prisma.alarm.delete({ where: { id: newAlarm.id } });
      console.log(`❌ Alarm ${newAlarm.id} deleted.`);
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Alarm processed successfully.",
        alarm: newAlarm,
      });
  } catch (err) {
    console.error(`❌ Error setting alarm: `, err);
    res.status(500).json({
      error: "unexpected_error",
      message: err instanceof Error ? err.message : `${err}`,
    });
  }
};




export const editAlarm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { alarmId } = req.params;
    if (!alarmId) {
      res.status(400).json({ error: "validation_error", message: "Alarm ID is required." });
      return;
    }

    // Destructure possible fields from the request body for partial updates
    const { name, type, tagId, isEnabled, status, subproperty } = req.body;
    const dataToUpdate: any = {};

    if (name !== undefined) {
      dataToUpdate.name = name;
    }
    if (type !== undefined) {
      dataToUpdate.type = type;
    }
    if (isEnabled !== undefined) {
      dataToUpdate.isEnabled = isEnabled;
    }
    if (status !== undefined) {
      dataToUpdate.status = status;
    }
    if (subproperty !== undefined) {
      dataToUpdate.subproperty = JSON.stringify(subproperty);
    }
    // Only update the tag connection if tagId is provided
    if (tagId !== undefined) {
      dataToUpdate.tag = { connect: { id: tagId } };
    }

    // If no fields are provided, return an error.
    if (Object.keys(dataToUpdate).length === 0) {
      res.status(400).json({
        error: "validation_error",
        message: "No valid fields provided for update.",
      });
      return;
    }

    // Update the alarm record in the DB
    const updatedAlarm = await prisma.alarm.update({
      where: { id: alarmId },
      data: dataToUpdate,
            include: { tag: true },

    });

    console.log(`✅ Alarm ${updatedAlarm.id} updated successfully in DB.`);
    // Notice: We do NOT call alarmManager.addOrUpdateAlarmInMemory(updatedAlarm) here.
    // The Prisma middleware will automatically intercept this update and update the in-memory manager.

    res.status(200).json({
      success: true,
      message: "Alarm updated successfully.",
      alarm: updatedAlarm,
    });
  } catch (error: any) {
    console.error("Error updating alarm:", error.message);
    res.status(500).json({
      error: "unexpected_error",
      message: error.message,
    });
  }
};

export const setAlarmAck = async (req: Request, res: Response): Promise<void> => {
  try {
    const { alarmId } = req.params;    // e.g. /alarms/:alarmId/ack
    const userId = req.userId;         // from auth middleware

    // 1) Validate presence
    if (!alarmId) {
      res.status(400).json({
        success: false,
        message: "Alarm ID is required.",
      });
      return; // <-- End the function
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not found in request context (userId).",
      });
      return; // <-- End the function
    }

    // 2) Fetch user details (optional if you want to confirm user exists)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    if (!user) {
      res.status(404).json({
        success: false,
        message: `User with ID ${userId} not found.`,
      });
      return; // <-- End the function
    }

    // 3) Check that the alarm exists in DB
    const alarm = await prisma.alarm.findUnique({ where: { id: alarmId } ,     
    });
    if (!alarm) {
      res.status(404).json({
        success: false,
        message: `Alarm with ID ${alarmId} not found.`,
      });
      return; // <-- End the function
    }

    // 4) Acknowledge the alarm in memory
    //    setAlarmAck expects (alarmId, username) if that's how you implemented it
    const changed = await alarmManager.setAlarmAck(alarmId, user.username);

    // 5) Return a response based on the result
    if (changed) {
      res.status(200).json({
        success: true,
        message: `Alarm ${alarmId} acknowledged by ${user.username}.`,
      });
    } else {
      // If there's no matching in-memory alarm or it's already acknowledged
      res.status(400).json({
        success: false,
        message: "No matching in-memory alarm, or it was already acknowledged.",
      });
    }
  } catch (error) {
    console.error("Error acknowledging alarm:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};







export const getAlarmHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1) Extract the fromDate/toDate strings from the JSON body
    //    If not provided, default them to "today".
    const fromDateStr = req.body.fromDate || new Date().toISOString().slice(0, 10);
    const toDateStr = req.body.toDate || new Date().toISOString().slice(0, 10);

    // 2) Convert each date string into start-of-day and end-of-day in UTC
    //    For fromDate, we want 00:00:00.000
    const fromDate = new Date(fromDateStr);
    const fromYear = fromDate.getUTCFullYear();
    const fromMonth = fromDate.getUTCMonth(); // 0-based
    const fromDay = fromDate.getUTCDate();
    const fromStart = new Date(Date.UTC(fromYear, fromMonth, fromDay, 0, 0, 0, 0));

    // For toDate, we want 23:59:59.999
    // Alternatively, if you want an exclusive bound, you can go from the next day’s 00:00:00
    const toDate = new Date(toDateStr);
    const toYear = toDate.getUTCFullYear();
    const toMonth = toDate.getUTCMonth();
    const toDay = toDate.getUTCDate();
    const toEnd = new Date(Date.UTC(toYear, toMonth, toDay, 23, 59, 59, 999));

    console.log(
      `Fetching AlarmHistory from ${fromStart.toISOString()} to ${toEnd.toISOString()}`
    );

    // 3) Query with Prisma, filtering `createdAt` between those boundaries
    const history = await prisma.alarmHistory.findMany({
      where: {
        createdAt: {
          gte: fromStart,  // >= fromStart
          lte: toEnd,      // <= toEnd
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 4) Return the matching rows
     res.status(200).json(history);
  } catch (error: any) {
    console.error("Error fetching alarm history by date range:", error.message);
     res.status(500).json({
      error: "unexpected_error",
      message: error.message,
    });
  }
};

export const clearOneAlarm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { alarmId } = req.params;
    if (!alarmId) {
     res.status(400).json({ 
        success: false, 
        message: "Alarm ID is required." 
      });
    }

    // 1) Delete the alarm from DB
    await prisma.alarm.delete({
      where: { id: alarmId },
    });

   

    res.status(200).json({
      success: true,
      message: `Alarm ${alarmId} has been removed.`,
    });
  } catch (error: any) {
    console.error("Error clearing one alarm:", error);
   res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**

 * Clears all alarms from the DB and in-memory manager.
 */
export const clearAllAlarms = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1) Delete all alarms in DB
    await prisma.alarm.deleteMany({});

    // 2) Also empty them in memory
    alarmManager.clearAlarmsFlag = true; // or directly do alarmManager.clearAlarms()
    // If you have a dedicated method:
    // await alarmManager.clearAlarms(true);

    res.status(200).json({
      success: true,
      message: "All alarms have been cleared from the database and memory.",
    });
  } catch (error: any) {
    console.error("Error clearing all alarms:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /alarms/history
 * Deletes all alarm histories from the DB.
 * (If you want partial or date-based, adapt as needed.)
 */
export const deleteAllAlarmHistories = async (req: Request, res: Response): Promise<void> => {
  try {
    // If your alarm history table is named alarmHistory:
    await prisma.alarmHistory.deleteMany({});

    res.status(200).json({
      success: true,
      message: "All alarm histories have been deleted.",
    });
  } catch (error: any) {
    console.error("Error deleting alarm histories:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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