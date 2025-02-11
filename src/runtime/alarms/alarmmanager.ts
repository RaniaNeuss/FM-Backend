import { PrismaClient } from "@prisma/client";
import { EventEmitter } from "events";

const prisma = new PrismaClient();

// Enum for Alarm Status
enum AlarmStatusEnum {
    INIT = "init",
    LOAD = "load",
    IDLE = "idle",
}

// Enum for Alarm Types
enum AlarmsTypes {
    HIGH_HIGH = "highhigh",
    HIGH = "high",
    LOW = "low",
    INFO = "info",
    ACTION = "action",
}

// Define the Alarm class
class Alarm {
    id: string;
    name: string;
    type: string;
    subproperty: any;
    tagproperty: any;
    status: string;
    ontime: number;
    offtime: number;
    acktime: number;
    lastcheck: number;
    toremove: boolean;
    userack?: string;

    constructor(
        id: string,
        name: string,
        type: string,
        subproperty: any,
        tagproperty: any,
        status: string
    ) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.subproperty = subproperty ? JSON.parse(subproperty) : {};
        this.tagproperty = tagproperty ? JSON.parse(tagproperty) : {};
        this.status = status || AlarmStatusEnum.INIT;
        this.ontime = 0;
        this.offtime = 0;
        this.acktime = 0;
        this.lastcheck = 0;
        this.toremove = false;
    }

    getId(): string {
        return `${this.name}^~^${this.type}`;
    }

    setAck(user: string) {
        if (!this.acktime) {
            this.acktime = Date.now();
            this.userack = user;
        }
    }
}

// Define the AlarmsManager class
class AlarmsManager {
    runtime: any;
    alarms: { [key: string]: Alarm[] } = {};
    status: AlarmStatusEnum = AlarmStatusEnum.INIT;
    events: EventEmitter;
    
    constructor(runtime: any) {
        this.runtime = runtime;
        this.events = new EventEmitter();
    }

    // Start monitoring alarms
    start(): void {
        setInterval(() => {
            this.checkStatus();
        }, 1000);
    }

    // Check the status of alarms
    private checkStatus(): void {
        if (this.status === AlarmStatusEnum.INIT) {
            this.loadAlarms();
        } else if (this.status === AlarmStatusEnum.IDLE) {
            this.processAlarms();
        }
    }

    // Load alarms into memory
    private async loadAlarms() {
        try {
            this.status = AlarmStatusEnum.LOAD;

            // Fetch alarms with related `Tag`
            const alarmsFromDB = await prisma.alarm.findMany({
                include: {
                    tag: true, // Fetch related tag details
                },
            });

            this.alarms = alarmsFromDB.reduce((acc: any, alarm: any) => {
                const parsedAlarm = new Alarm(
                    alarm.id,
                    alarm.name,
                    alarm.type,
                    alarm.subproperty,
                    alarm.tag ? JSON.stringify(alarm.tag) : "{}",
                    alarm.status
                );

                if (!acc[alarm.name]) acc[alarm.name] = [];
                acc[alarm.name].push(parsedAlarm);

                return acc;
            }, {});

            this.status = AlarmStatusEnum.IDLE;
        } catch (error) {
            console.error("Failed to load alarms:", error);
        }
    }

    // Process alarm conditions
    private async processAlarms() {
        for (const key in this.alarms) {
            this.alarms[key].forEach(async (alarm) => {
                if (alarm.status === AlarmStatusEnum.IDLE) {
                    console.log(`Processing alarm: ${alarm.name}`);

                    // Fetch current tag value
                    const tagValue = parseFloat(alarm.tagproperty.value || "0");
                    const minThreshold = alarm.subproperty.min;
                    const maxThreshold = alarm.subproperty.max;

                    // Trigger alarm if value is out of range
                    if (tagValue < minThreshold || tagValue > maxThreshold) {
                        console.log(`⚠️ Alarm Triggered: ${alarm.name}`);

                        // Update alarm status in DB
                        await prisma.alarm.update({
                            where: { id: alarm.id },
                            data: { status: "triggered", onTime: new Date() },
                        });

                        this.events.emit("alarmTriggered", alarm);
                    }
                }
            });
        }
    }

    // Get all active alarms
    async getActiveAlarms() {
        const alarms = await prisma.alarm.findMany({
            where: { status: "triggered" },
            include: { tag: true },
        });

        return alarms.map((alarm) => ({
            ...alarm,
            subproperty: alarm.subproperty ? JSON.parse(alarm.subproperty) : {},
            tagproperty: alarm.tag ? JSON.stringify(alarm.tag) : "{}",
        }));
    }

    // Acknowledge an alarm
    async acknowledgeAlarm(alarmId: string, userId: string) {
        try {
            return await prisma.alarm.update({
                where: { id: alarmId },
                data: { ackTime: new Date(), status: "acknowledged" },
            });
        } catch (err) {
            throw new Error(`Failed to acknowledge alarm: ${err}`);
        }
    }
}

export default AlarmsManager;



