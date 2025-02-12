import { PrismaClient } from "@prisma/client";
import { EventEmitter } from "events";

const prisma = new PrismaClient();

// ✅ Using same constant names from runtime
enum AlarmStatusEnum {
    VOID = "",
    ON = "N",
    OFF = "NF",
    ACK = "NA",
}

enum AlarmsStatusEnum {
    INIT = "init",
    LOAD = "load",
    IDLE = "idle",
}

enum AlarmsTypes {
    HIGH_HIGH = "highhigh",
    HIGH = "high",
    LOW = "low",
    INFO = "info",
    ACTION = "action",
}

enum AlarmAckModeEnum {
    FLOAT = "float",
    ACK_ACTIVE = "ackactive",
    ACK_PASSIVE = "ackpassive",
}

enum ActionsTypes {
    POPUP = "popup",
    SET_VALUE = "setValue",
    SET_VIEW = "setView",
    SEND_MSG = "sendMsg",
    RUN_SCRIPT = "runScript",
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
        this.status = status || AlarmStatusEnum.VOID;
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
    status: AlarmsStatusEnum = AlarmsStatusEnum.INIT;
    events: EventEmitter;

    constructor(runtime: any) {
        this.runtime = runtime;
        this.events = new EventEmitter();
    }

    // Start monitoring alarms
    start(): void {
        console.log("🔄 Starting Alarm Manager...");
        setInterval(() => {
            console.log("🔍 Checking alarm status...");
            this.checkStatus();
        }, 5000); // Runs every 5 seconds for debugging
    }

    // Check the status of alarms
    private async checkStatus(): Promise<void> {
        console.log(`📌 Current alarm manager state: ${this.status}`);

        if (this.status === AlarmsStatusEnum.INIT) {
            console.log("⏳ Loading alarms into memory...");
            await this.loadAlarms();
        } else if (this.status === AlarmsStatusEnum.IDLE) {
            console.log("🛠️ Processing alarms...");
            await this.processAlarms();
        }
    }

    // Load alarms into memory
    private async loadAlarms() {
        try {
            this.status = AlarmsStatusEnum.LOAD;

            console.log("📡 Fetching alarms from the database...");
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

            console.log(`✅ Loaded ${alarmsFromDB.length} alarms into memory.`);
            this.status = AlarmsStatusEnum.IDLE;
        } catch (error) {
            console.error("❌ Failed to load alarms:", error);
        }
    }

    // Process alarm conditions
    private async processAlarms() {
        console.log("🔄 Checking alarms for status updates...");
        for (const key in this.alarms) {
            this.alarms[key].forEach(async (alarm) => {
                console.log(`🔍 Processing alarm: ${alarm.name} | Status: ${alarm.status}`);

                // Fetch current tag value
                const tagValue = parseFloat(alarm.tagproperty.value || "0");
                const minThreshold = alarm.subproperty.min;
                const maxThreshold = alarm.subproperty.max;

                if (tagValue >= minThreshold && tagValue <= maxThreshold) {
                    console.log(`🚨 Alarm Triggered: ${alarm.name} (Value: ${tagValue})`);

                    // Update alarm status in DB
                    await prisma.alarm.update({
                        where: { id: alarm.id },
                        data: { status: AlarmStatusEnum.ON, onTime: new Date() },
                    });

                    this.events.emit("alarmTriggered", alarm);
                }
            });
        }
    }

    // Get all active alarms
    async getActiveAlarms() {
        console.log("📡 Fetching active alarms...");
        const alarms = await prisma.alarm.findMany({
            where: { status: AlarmStatusEnum.ON },
            include: { tag: true },
        });

        console.log(`✅ Found ${alarms.length} active alarms.`);
        return alarms.map((alarm) => ({
            ...alarm,
            subproperty: alarm.subproperty ? JSON.parse(alarm.subproperty) : {},
            tagproperty: alarm.tag ? JSON.stringify(alarm.tag) : "{}",
        }));
    }

    // Acknowledge an alarm
    async acknowledgeAlarm(alarmId: string, userId: string) {
        try {
            console.log(`📝 Acknowledging alarm: ${alarmId} by user ${userId}`);
            return await prisma.alarm.update({
                where: { id: alarmId },
                data: { ackTime: new Date(), status: AlarmStatusEnum.ACK },
            });
        } catch (err) {
            console.error(`❌ Failed to acknowledge alarm: ${err}`);
            throw new Error(`Failed to acknowledge alarm: ${err}`);
        }
    }   
}

const alarmManager = new AlarmsManager({});
export default alarmManager;
