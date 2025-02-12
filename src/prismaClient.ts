

import { PrismaClient,Device } from '@prisma/client';
import deviceManager from './runtime/devices/deviceManager';
import alarmManager from './runtime/alarms/alarmmanager';




const prisma = new PrismaClient().$extends({
  query: {
    device: {
      async $allOperations({ operation, args, query }) {
        console.log(`Intercepted operation on Device: ${operation}`);
        console.log('Arguments:', args);

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
    
  },
},




);

export default prisma;







