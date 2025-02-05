import HTTPClient from '../devices/httprequest/httpClient';
import prisma from '../../prismaClient';
import { EventEmitter } from 'events';
import {io} from '../../server'; // Import the Socket.IO instance

const pollingIntervals: { [deviceId: string]: NodeJS.Timeout } = {};

/**
 * Initialize and poll all enabled devices.
 */ 

const initializeAndPollDevices = async (devices: any[]) => {
  try {
    if (devices.length == 0) {
      return console.log('No enabled devices found.');
    }

    for (const device of devices) {
      if (device.type !== 'WebAPI') continue;

      console.log(`Initializing device '${device.name}'...`);

      const property = device.property ? JSON.parse(device.property) : {};
      if (!property.address) {
        console.error(`Device '${device.name}' is missing a valid address.`);
        continue;
      }

      const logger = console;
      const events = new EventEmitter();
      const runtime = {};
      const httpClient = HTTPClient.create(
        { name: device.name, property, id: device.id },
        logger,
        events,
        runtime,
        prisma,io
      );

      try {
        const isConnected = await httpClient.connect(device.id);
      } catch (error) {
        console.error(`Error connecting to device '${device.name}':`, error);
        continue;
      }
    

      httpClient.load(device);
      startPolling(device, httpClient);
    }
  } catch (error) {
    console.error('Error during device initialization and polling:', error);
  }
};

/**
 * Start polling for a specific device.
 */
const startPolling = (device: any, httpClient: any) => {
  const pollingInterval = device.polling || 5000; // Default to 5 seconds

  pollingIntervals[device.id] = setInterval(async () => {
    try {
      await httpClient.polling(device.id);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Polling error for device '${device.name}':`, error.message);
      } else {
        console.error(`Polling error for device '${device.name}':`, error);
      }
    }
  }, pollingInterval);
};


/**
 * Stop polling for a specific device.
 */
const stopPolling = (deviceId: string) => {
  if (pollingIntervals[deviceId]) {
    clearInterval(pollingIntervals[deviceId]);
    delete pollingIntervals[deviceId];
    console.log(`Stopped polling for device: ${deviceId}.`);
  } else {
    console.log(`No active polling found for device: ${deviceId}.`);
  }
};





/**
 * Handle device updates.
 */
const handleDeviceUpdated = async (updatedDevice: any, prevDevice: any) => {
  console.log(`Device updated: ${updatedDevice.name}`);

  let property = {};
  try {
    property = JSON.parse(updatedDevice.property || '{}');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to parse property for device '${updatedDevice.name}':`, error.message);
    } else {
      console.error(`Failed to parse property for device '${updatedDevice.name}':`, error);
    }
    return;
  }

  // Check if 'enabled' field changed
  if (prevDevice.enabled !== updatedDevice.enabled) {
    if (updatedDevice.enabled) {
      console.log(`Device '${updatedDevice.name}' enabled. Starting polling...`);
      const logger = console;
      const events = new EventEmitter();
      const runtime = {};
      const httpClient = HTTPClient.create(
        { name: updatedDevice.name, property, id: updatedDevice.id },
        logger,
        events,
        runtime,
        prisma,
        io
      );
      startPolling(updatedDevice, httpClient);
    } else {
      console.log(`Device '${updatedDevice.name}' disabled. Stopping polling...`);
      stopPolling(updatedDevice.id);
    }
  }

  // Check if the 'polling' interval changed
  if (prevDevice.polling !== updatedDevice.polling) {
    console.log(`Polling interval for '${updatedDevice.name}' changed.`);
    stopPolling(updatedDevice.id);
    if (updatedDevice.enabled) {
      const logger = console;
      const events = new EventEmitter();
      const runtime = {};
      const httpClient = HTTPClient.create(
        { name: updatedDevice.name, property, id: updatedDevice.id },
        logger,
        events,
        runtime,
        prisma,io
      );
      startPolling(updatedDevice, httpClient);
    }
  }
};


/**
 * Handle device deletion.
 */
const handleDeviceDeleted = (deviceId: string) => {
  console.log(`Device deleted: ${deviceId}`);
  stopPolling(deviceId);
};

export default {
  initializeAndPollDevices,
  handleDeviceUpdated,
  handleDeviceDeleted,
};