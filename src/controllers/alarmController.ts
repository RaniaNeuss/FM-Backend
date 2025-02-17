import { Request, Response } from 'express';
import * as alarmstorage from '../runtime/alarms/alarmstorage';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { getAlarmsHistory } from '../runtime/alarms/alarmstorage';




//set alarm


// export const setAlarm = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { projectId } = req.params;
//     const alarm = req.body;

//     if (!projectId) {
//       res.status(400).json({
//         error: "validation_error",
//         message: "Project ID is required in the URL parameters.",
//       });
//     }

//     if (!alarm || typeof alarm !== "object") {
//       res.status(400).json({
//         error: "validation_error",
//         message: "Expected an object containing alarm data in the request body.",
//       });
//     }

//     console.log("Processing alarm for projectId:", projectId);

//     const { id, name,text, type, tagId, min, max, interval, timeInMinMaxRange, status } = alarm;

//     if (!type || !tagId || min == null || max == null || !interval) {
//       res.status(400).json({
//         error: "validation_error",
//         message: "Missing required fields: type, tagId, min, max, interval are mandatory.",
//       });
//     }

//     // Check if the tag exists
//     const tag = await prisma.tag.findUnique({ where: { id: tagId } });
//     if (!tag) {
//      res.status(400).json({
//         error: "validation_error",
//         message: `Tag with id ${tagId} not found.`,
//       });
//     }

//     // 🔹 Fetch all users that belong to groups "SuperAdmin" or "Editor"
//     const users = await prisma.user.findMany({
//       where: {
//         groups: {
//           some: {
//             name: { in: ["SuperAdmin", "Editor"] } // Only fetch users in these groups
//           }
//         }
//       },
//       select: { id: true } // Only fetch user IDs
//     });

//     if (users.length === 0) {
//       res.status(400).json({
//         error: "validation_error",
//         message: "No users found in groups 'SuperAdmin' or 'Editor'.",
//       });
//     }

//     // Extract user IDs
//     const userIds = users.map(user => ({ id: user.id }));

//     // 🔹 Upsert the alarm and associate with users
//     const upsertedAlarm = await prisma.alarm.upsert({
//       where: id ? { id } : { id: "non-existent-id" },
//       create: {
//         name,
//         type,
//         text,
//         tag: { connect: { id: tagId } },
//         min,
//         max,
//         interval,
//         timeInMinMaxRange: timeInMinMaxRange || 0, // Include new field
//         isEnabled: alarm.isEnabled || false,
//         project: { connect: { id: projectId } },
//         users: { connect: userIds } // Connect users to the alarm
//       },
//       update: {
//         name,
//         type,
//         tagId,
//         min,
//         max,
//         interval,
//         timeInMinMaxRange: timeInMinMaxRange || 0, // Include new field
//         isEnabled: alarm.isEnabled || false,
//         users: { set: userIds } // Update the associated users
//       },
//     });

//     console.log(`Alarm ${upsertedAlarm.id} upserted successfully.`);

//     // 🔹 Insert into alarm history
//     await prisma.alarmHistory.create({
//       data: {
//         alarmId: upsertedAlarm.id,
//         type,
//         status: status || "inactive",
//         text: alarm.text || "",
//       },
//     });

//     console.log(`History for alarm ${upsertedAlarm.id} created successfully.`);

//     res.status(200).json({
//       success: true,
//       message: "Alarm processed successfully.",
//     });

//   } catch (err: any) {
//     console.error(`Error setting alarm: ${err.message}`);
//     res.status(500).json({
//       error: "unexpected_error",
//       message: err.message,
//     });
//   }
// };


  

// export const setAlarm = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { projectId } = req.params;
//     const alarm = req.body;

//     // Validate `projectId`
//     if (!projectId) {
//       res.status(400).json({
//         error: "validation_error",
//         message: "Project ID is required in the URL parameters.",
//       });
//       return;
//     }

//     // Validate request body
//     if (!alarm || typeof alarm !== "object") {
//       res.status(400).json({
//         error: "validation_error",
//         message: "Expected an object containing alarm data in the request body.",
//       });
//       return;
//     }

//     console.log("Processing alarm for projectId:", projectId);

//     const {
//       id,
//       name,
//       type,
//       tagId,
//       isEnabled,
//       status,
//       subproperty, // Now includes min, max, interval, and timeInMinMaxRange
//     } = alarm;

//     // Validate required fields inside `subproperty`
//     if (!type || !tagId || !subproperty || typeof subproperty !== "object") {
//       res.status(400).json({
//         error: "validation_error",
//         message:
//           "Missing required fields: type, tagId, and subproperty are mandatory.",
//       });
//       return;
//     }

//     const { min, max, interval, timeInMinMaxRange ,text} = subproperty;

//     if (min == null || max == null || !interval) {
//       res.status(400).json({
//         error: "validation_error",
//         message:
//           "subproperty must include min, max, interval, and optionally timeInMinMaxRange.",
//       });
//       return;
//     }

//     // Ensure `tagId` exists
//     const tag = await prisma.tag.findUnique({ where: { id: tagId } });
//     if (!tag) {
//       res.status(404).json({
//         error: "not_found",
//         message: `Tag with id ${tagId} not found.`,
//       });
//       return;
//     }

//     //Fetch all users that belong to groups "SuperAdmin" or "Editor"
//     const users = await prisma.user.findMany({
//       where: {
//         groups: {
//           some: {
//             name: { in: ["SuperAdmin", "Editor"] } // Only fetch users in these groups
//           }
//         }
//       },
//       select: { id: true } // Only fetch user IDs
//     });

//     if (users.length === 0) {
//       res.status(400).json({
//         error: "validation_error",
//         message: "No users found in groups 'SuperAdmin' or 'Editor'.",
//       });
//     }

//     // Extract user IDs
//     const userIds = users.map(user => ({ id: user.id }));


//     // 🔹 Upsert (Create or Update) Alarm
//     const upsertedAlarm = await prisma.alarm.upsert({
//       where: id ? { id } : { id: "non-existent-id" },
//       create: {
//         name,
//         type,
        
//         tag: { connect: { id: tagId } },
//         subproperty: JSON.stringify(subproperty), // Store subproperty as JSON
//         isEnabled: isEnabled ?? false,
//         project: { connect: { id: projectId } },
//         users: { connect: userIds },
//       },
//       update: {
//         name,
//         type,
//         tagId,
//         subproperty: JSON.stringify(subproperty), // Update subproperty
//         isEnabled: isEnabled ?? false,
//         users: { set: userIds },
//       },
//     });

//     console.log(`✅ Alarm ${upsertedAlarm.id} upserted successfully.`);

//     // 🔹 Insert into `alarmHistory`
//     await prisma.alarmHistory.create({
//       data: {
//         alarmId: upsertedAlarm.id,
//         type,
//         status: status || "inactive",
      
//       },
//     });

//     console.log(`✅ History for alarm ${upsertedAlarm.id} created successfully.`);

//     res.status(200).json({
//       success: true,
//       message: "Alarm processed successfully.",
//       alarm: upsertedAlarm,
//     });
//   } catch (err: any) {
//     console.error(`❌ Error setting alarm: ${err.message}`);
//     res.status(500).json({
//       error: "unexpected_error",
//       message: err.message,
//     });
//   }
// };


// Alarm Status Enum (Matching Runtime)
const AlarmStatusEnum = {
  VOID: "VOID",
  ON: "N",
  OFF: "NF",
  ACK: "NA",
};

export const setAlarm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const alarm = req.body;

    // Validate `projectId`
    if (!projectId) {
      res.status(400).json({
        error: "validation_error",
        message: "Project ID is required in the URL parameters.",
      });
      return;
    }

    // Validate request body
    if (!alarm || typeof alarm !== "object") {
      res.status(400).json({
        error: "validation_error",
        message: "Expected an object containing alarm data in the request body.",
      });
      return;
    }

    console.log("Processing alarm for projectId:", projectId);

    const {
      id,
      name,
      type,
      tagId,
      isEnabled,
      status, // Ensure status is handled correctly
      subproperty, // Includes min, max, interval, and timeInMinMaxRange
      toremove, // Indicates if the alarm should be removed
      ontime,
      offtime,
      acktime,
      userack,
    } = alarm;

    // Validate required fields inside `subproperty`
    if (!type || !tagId || !subproperty || typeof subproperty !== "object") {
      res.status(400).json({
        error: "validation_error",
        message:
          "Missing required fields: type, tagId, and subproperty are mandatory.",
      });
      return;
    }

    const { min, max, checkDelay, timedelay, group,text ,ackmode } = subproperty;

    if (min == null || max == null || !checkDelay || ! timedelay) {
      res.status(400).json({
        error: "validation_error",
        message:
          "subproperty must include min, max, interval, and  timeInMinMaxRange.",
      });
      return;
    }

    // Ensure `tagId` exists
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      res.status(404).json({
        error: "not_found",
        message: `Tag with id ${tagId} not found.`,
      });
      return;
    }
//Fetch all users that belong to groups "SuperAdmin" or "Editor"
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

    // Determine initial status based on tag value
    const tagValue = parseFloat(tag.value || "0");
    let initialStatus = AlarmStatusEnum.VOID;

    if (tagValue >= min && tagValue <= max) {
      initialStatus = AlarmStatusEnum.ON;
    }

    // If a valid `status` is provided, use it; otherwise, use `initialStatus`
    const finalStatus = status && Object.values(AlarmStatusEnum).includes(status)
      ? status
      : initialStatus;

    // 🔹 Upsert (Create or Update) Alarm
    const upsertedAlarm = await prisma.alarm.upsert({
      where: id ? { id } : { id: "non-existent-id" },
      create: {
        name,
        type,
      
        tag: { connect: { id: tagId } },
        subproperty: JSON.stringify(subproperty), // Store subproperty as JSON
        isEnabled: isEnabled ?? false,
        status: finalStatus, // Store correct status from runtime
        project: { connect: { id: projectId } },
        users: { connect: userIds },
        ontime: ontime ? new Date(ontime) : null,
        offtime: offtime ? new Date(offtime) : null,
        acktime: acktime ? new Date(acktime) : null,
        userack: userack ?  userack :null,
        
      },
      update: {
        name,
        type,
        tagId,
        subproperty: JSON.stringify(subproperty), // Update subproperty
        isEnabled: isEnabled ?? false,
        status: finalStatus, // Ensure status updates correctly
        users: { set: userIds },
        ontime: ontime ? new Date(ontime) : null,
        offtime: offtime ? new Date(offtime) : null,
        acktime: acktime ? new Date(acktime) : null,
        userack: userack ?  userack :null,

      },
    });

    console.log(`✅ Alarm ${upsertedAlarm.id} upserted successfully.`);

    // 🔹 Insert into `chronicle` (Alarm History)
    await prisma.alarmHistory.create({
      data: {
        alarmId: upsertedAlarm.id,
        type,
        name,
        status: finalStatus,
        text: subproperty.text || "", // Uses alarm.subproperty.text directly
        group: subproperty.group || "", // Uses alarm.subproperty.group directly
        ontime: upsertedAlarm.ontime, // Matches `alarm`
        offtime: upsertedAlarm.offtime, // Matches `alarm`
        acktime: upsertedAlarm.acktime, // Matches `alarm`
        userack: upsertedAlarm.userack || "",
      },
    });

    console.log(`✅ History for alarm ${upsertedAlarm.id} created successfully.`);

    // 🔹 Delete alarm if `toremove` is true
    if (toremove) {
      await prisma.alarm.delete({
        where: { id: upsertedAlarm.id },
      });

      console.log(`❌ Alarm ${upsertedAlarm.id} deleted successfully.`);
    }

    res.status(200).json({
      success: true,
      message: "Alarm processed successfully.",
      alarm: upsertedAlarm,
    });
  } catch (err: any) {
    console.error(`❌ Error setting alarm: ${err.message}`);
    res.status(500).json({
      error: "unexpected_error",
      message: err.message,
    });
  }
};




// Controller: Acknowledge Alarm
export const acknowledgeAlarm = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id} = req.params;
        const userId = req.userId;


        if (!userId) {
            res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
            return;
        }
      
    
        // Validate alarmId
        if (!id) {
            res.status(400).json({
                error: 'missing_alarm_id',
                message: 'alarmId is required.',
            });
            return;
        }

        console.log(`Acknowledging alarm with alarmId: ${id}, userId: ${userId}`);

        // Acknowledge alarm
        const result = await alarmstorage.setAlarmAck(id, userId);

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