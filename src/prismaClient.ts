

import { PrismaClient,Device,Tag ,Alarm} from '@prisma/client';
import deviceManager from './runtime/devices/deviceManager';
import alarmManager from './runtime/alarms/alarmmanager';




const prisma = new PrismaClient().$extends({
  query: {
    device: {
      async $allOperations({ operation, args, query }) {
        console.log(`Intercepted operation on Device: ${operation}`);

        let prevDevice: Device | null = null;

        try {
          // For "update" operation, fetch the previous state of the device
          if (operation === 'update') {
            const deviceId = args.where?.id; // Ensure `id` exists in the `where` clause

            if (deviceId) {
              prevDevice = await prisma.device.findUnique({
                where: { id: deviceId }, // Use `id` to find the device
              });
            } else {
              console.warn('No `id` provided in `where` clause for update operation.');
            }
          }

          // Execute the original operation
          const result = await query(args);

          if (operation === 'create') {
            const device = result as Device;
            console.log(`Device created with ID: ${device.id}`);
            if (device.enabled) {
              console.log(`Initializing polling for new device '${device.name}'...`);
              deviceManager.initializeAndPollDevices([device]);
            }
          } else if (operation === 'delete') {
            const deletedDeviceId = args.where?.id;
            if (deletedDeviceId) {
              console.log(`Device deleted with ID: ${deletedDeviceId}`);
              deviceManager.handleDeviceDeleted(deletedDeviceId);
            }
          } else if (operation === 'update') {
            const updatedDevice = result as Device;
            if (prevDevice) {
              console.log(`Device updated with ID: ${updatedDevice.id}`);
              deviceManager.handleDeviceUpdated(updatedDevice, prevDevice);
            } else {
              console.warn(`No previous state found for device with ID: ${args.where?.id}`);
            }
          }

          return result;
        } catch (err) {
          console.error('Error in Prisma middleware:', err);
          throw err;
        }
      },
    },
   



    
    tag: {
      async $allOperations({ operation, args, query }) {
        console.log(`📡 Intercepted operation on Tag: ${operation}`);
        console.log("🔎 Arguments:", args);

        let prevTag: Tag | null = null;

        try {
          if (operation === "update") {
            const tagId = args.where?.id;

            if (tagId) {
              prevTag = await prisma.tag.findUnique({ where: { id: tagId } });
            } else {
              console.warn("⚠️ No `id` provided in `where` clause for update operation.");
            }
          }

          const result = await query(args);

          if (operation === "update") {
            const updatedTag = result as Tag;

            if (prevTag) {
              console.log(`🔄 Tag updated: ${updatedTag.id}`);
              console.log(`📌 Previous Value: ${prevTag.value}, New Value: ${updatedTag.value}`);

              if (prevTag.value !== updatedTag.value) {
                console.log(`⚡ Tag value changed! Fetching updated tag and reprocessing alarms...`);
                
                // Fetch updated tag values before triggering alarm checks
                const latestTag = await prisma.tag.findUnique({ where: { id: updatedTag.id } });

                if (latestTag) {
                  console.log(`✅ Latest Tag Value: ${latestTag.value}`);
                  alarmManager.processAlarms(); // Trigger alarm checks
                } else {
                  console.warn(`⚠️ Could not fetch latest tag value for ${updatedTag.id}`);
                }
              }
            } else {
              console.warn(`⚠️ No previous state found for tag with ID: ${args.where?.id}`);
            }
          }

          return result;
        } catch (err) {
          console.error("❌ Error in Prisma middleware:", err);
          throw err;
        }
      },
    },
  
  alarm: {
    async $allOperations({ operation, args, query }) {
      console.log(`🚨 Intercepted operation on Alarm: ${operation}`);
      console.log("Arguments:", args);
  
      let prevAlarm: Alarm | null = null;
  
      try {
        if (operation === "update") {
          const alarmId = args.where?.id;
          if (alarmId) {
            prevAlarm = await prisma.alarm.findUnique({
              where: { id: alarmId },
              include: {
                tag: true, // Ensure tag data is included
                alarmHistories: true, // Include related alarm histories
              },
            });
          }
        }
  
        const result = await query(args);
  
        if (operation === "update") {
          const updatedAlarm = result as Alarm;

          if (prevAlarm) {
            console.log(`alarm updated with ID: ${updatedAlarm.id}`);
            deviceManager.handleDeviceUpdated(updatedAlarm, prevAlarm);
          } else {
            console.warn(`No previous state found for device with ID: ${args.where?.id}`);
          }
        }

        return result;
      } catch (err) {
        console.error('Error in Prisma middleware:', err);
        throw err;
      }
    },
  },
}




  
  
});

export default prisma;