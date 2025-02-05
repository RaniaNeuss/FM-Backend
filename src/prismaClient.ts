

import { PrismaClient,Device } from '@prisma/client';
import deviceManager from './runtime/devices/deviceManager';


// const prisma = new PrismaClient().$extends({
//   query: {
//     device: {
//       async $allOperations({ operation, args, query }) {
//         console.log(`Intercepted operation on Device: ${operation}`);
//         console.log('Arguments:', args);

//         const result = await query(args);

//         // Handle `create` operation
//         if (operation === 'create') {
//           if (result && typeof result === 'object' && 'id' in result) {

//             const device = result as Device; // Type assertion
//             console.log(`Device created with ID: ${device.id}`);
//             if (device.enabled) {
//               console.log(`Device '${device.name}' is enabled. Initializing polling...`);
//               deviceManager.initializeAndPollDevices([device],); // Pass as array
//             }
//           }
//         }

//         // Handle `update` operation
//         if (operation === 'update') {
//           const updatedDevice = result as Device; // Type assertion
//           console.log(`Device update detected for ID: ${args.where.id}`);
          
//           const prevDevice = await prisma.device.findUnique({ where: { id: args.where.id } });
          
//           if (!prevDevice) {
//             console.error(`Previous device state not found for ID: ${args.where.id}`);
//           } else {
//             deviceManager.handleDeviceUpdated(updatedDevice, prevDevice);
//           }
//         }
        

//         // Handle `delete` operation
//         if (operation === 'delete') {
//           console.log(`Device delete detected for ID: ${args.where.id}`);
//           const deletedDeviceId = args.where.id;
//           if (deletedDeviceId) {
//             deviceManager.handleDeviceDeleted(deletedDeviceId); // Stop polling for the deleted device
//           }
//         }

//         return result;
//       },
//     },
//   },
// });



const prisma = new PrismaClient().$extends({
  query: {
    device: {
      async $allOperations({ operation, args, query }) {
        console.log(`Intercepted operation on Device: ${operation}`);
        console.log('Arguments:', args);

        const result = await query(args);

        if (operation === 'create') {
          const device = result as Device;
          console.log(`Device created with ID: ${device.id}`);
          if (device.enabled) {
            console.log(`Initializing polling for new device '${device.name}'...`);
            deviceManager.initializeAndPollDevices([device]);
          }
        } else if (operation === 'update') {
          console.log(`Device update detected for ID: ${args.where.id}`);

          // Fetch the updated device along with its tags
          const updatedDevice = await prisma.device.findUnique({
            where: { id: args.where.id },
            include: { tags: true }, // Include tags or other related models if needed
          });

          // Fetch the previous state of the device
          const prevDevice = await prisma.device.findUnique({
            where: { id: args.where.id },
          });

          if (!updatedDevice) {
            console.error(`Updated device not found for ID: ${args.where.id}`);
          } else if (!prevDevice) {
            console.error(`Previous device state not found for ID: ${args.where.id}`);
          } else {
            deviceManager.handleDeviceUpdated(updatedDevice, prevDevice); // Pass both devices for processing
          }


          
        } else if (operation === 'delete') {
          const deletedDeviceId = args.where.id;
          if (deletedDeviceId) {
            console.log(`Device deleted with ID: ${deletedDeviceId}`);
            deviceManager.handleDeviceDeleted(deletedDeviceId);
          }
        }

        return result;
      },
    },
  },
});

export default prisma;