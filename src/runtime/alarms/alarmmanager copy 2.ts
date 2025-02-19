




// import { PrismaClient } from "@prisma/client";
// import { EventEmitter } from "events";

// const prisma = new PrismaClient();

// enum AlarmStatusEnum {
//     VOID = "VOID",
//     ON = "N",
//     OFF = "NF",
//     ACK = "NA",
// }

// enum AlarmsStatusEnum {
//     INIT = "init",
//     LOAD = "load",
//     IDLE = "idle",
// }

// enum AlarmsTypes {
//     HIGH_HIGH = "highhigh",
//     HIGH = "high",
//     LOW = "low",
//     INFO = "info",
//     ACTION = "action",
// }

// enum AlarmAckModeEnum {
//     FLOAT = "float",
//     ACK_ACTIVE = "ackactive",
//     ACK_PASSIVE = "ackpassive",
// }

// enum ActionsTypes {
//     POPUP = "popup",
//     SET_VALUE = "setValue",
//     SET_VIEW = "setView",
//     SEND_MSG = "sendMsg",
//     RUN_SCRIPT = "runScript",
// }

// // Define the Alarm class
// class Alarm {
//     id: string;
//     name: string;
//     type: string;
//     subproperty: any;
//     tag: any;
//     isEnabled :boolean;
//     status: string;
//     ontime: number | null;  // Can be a number (timestamp) or null
//     offtime: number | null;
//     acktime: number | null;
//     lastcheck: number ;
//     toremove: boolean;

//     userack?: string;

//     constructor(id: string, name: string, type: string, subproperty: any, tag: any, status: string,isEnabled :boolean) {
//         this.id = id;
//         this.name = name;
//         this.type = type;
//         this.subproperty = subproperty ? JSON.parse(subproperty) : {};
//         this.tag = tag; // Directly use Prisma tag relationship
//         this.status = status || AlarmStatusEnum.VOID;
//         this.ontime = null;
//         this.isEnabled=isEnabled
//         this.offtime = null;
//         this.acktime = null;
//         this.lastcheck = 0;
//         this.toremove = false;

//         console.log(`🚀 [INIT] Alarm: ${this.name}, Initial Status: ${this.status}`);

//     }

//     getId(): string {
//         return `${this.name}^~^${this.type}`;
//     }

//     setAck(user: string) {
//         if (this.acktime == null) {
//             this.acktime = Date.now();
//             this.lastcheck = 0;
//             this.userack = user;
//             console.log(`📝 Alarm ${this.name} acknowledged by ${user}.`);
//         }
//     }


//     isToAck(): number | null {
//         if (this.subproperty.ackmode === AlarmAckModeEnum.FLOAT) {
//             return -1; // Floating alarms do not need acknowledgment
//         }
//         if (this.subproperty.ackmode === AlarmAckModeEnum.ACK_PASSIVE && this.status === AlarmStatusEnum.OFF) {
//             return 1; // Passive acknowledgment required when alarm is OFF
//         }
//         if (this.subproperty.ackmode === AlarmAckModeEnum.ACK_ACTIVE &&
//             (this.status === AlarmStatusEnum.OFF || this.status === AlarmStatusEnum.ON)) {
//             return 1; // Active acknowledgment required
//         }
//         return 0; // No acknowledgment required
//     }


//     init() {
//         this.toremove = false;
//         this.ontime = null;
//         this.offtime = null;
//         this.acktime = null;
//         this.status = AlarmStatusEnum.VOID;
//         this.lastcheck = 0;
//         this.userack = "";
//         console.log(`🔄 Alarm ${this.name} has been reset.`);
//     }

//     async check(currentTime: number, dt: number, tagValue: number | null): Promise<boolean> {
//         console.log(`🔍 Checking alarm: ${this.name} (${this.type})`);
    
//         // Prevent checking too frequently
//         if (this.lastcheck + (this.subproperty.checkdelay * 1000) > currentTime) {
//             console.log(`🛑 Skipping alarm check: lastcheck=${this.lastcheck}, currentTime=${currentTime}`);
//             return false;
//         }
    
//         this.lastcheck = currentTime;
//         this.toremove = false;
//         const onRange = tagValue !== null && tagValue >= this.subproperty.min && tagValue <= this.subproperty.max;
    
//         switch (this.status) {
//             case AlarmStatusEnum.VOID:
//                 console.log(`🔍 [${this.name}] Status: VOID, Checking activation...`);
                
//                 if (!onRange) {
//                     console.log(`🚫 [${this.name}] Not in range. Resetting ontime.`);
//                     this.ontime = null;
//                     return false;
//                 }
                
//                 if (this.ontime === null) {
//                     this.ontime = currentTime;
//                     console.log(`⏳ [${this.name}] First detected at: ${currentTime}, waiting for delay...`);
//                     return false;
//                 }
                
//                 console.log(`⏳ [${this.name}] Elapsed Time: ${currentTime - this.ontime}ms / Required: ${this.subproperty.timedelay * 1000}ms`);
                
//                 if (this.ontime + (this.subproperty.timedelay * 1000) <= currentTime) {
//                     this.status = AlarmStatusEnum.ON;
//                     console.log(`🚨 [${this.name}] Alarm triggered! Transitioning to ON.`);
//                     return true;
//                 }
                
//                 console.log(`⏳ [${this.name}] Still waiting for timedelay to pass.`);
//                 return false;



    
//             case AlarmStatusEnum.ON:
//                 if (!onRange) {
//                     this.status = AlarmStatusEnum.OFF;
//                     if (this.offtime === null) {
//                         this.offtime = currentTime;
//                     }
//                     console.log(`🔕 Alarm ${this.name} turned OFF.`);
//                     this.toremove = this.subproperty.ackmode === AlarmAckModeEnum.FLOAT || this.acktime !== null;
//                     return true;
//                 }
//                 if (this.acktime) {
//                     this.status = AlarmStatusEnum.ACK;
//                     console.log(`📝 Alarm ${this.name} acknowledged.`);
//                     return true;
//                 }
//                 return false;



    
//             case AlarmStatusEnum.OFF:
//                 if (onRange) {
//                     this.status = AlarmStatusEnum.ON;
//                     this.acktime = null;
//                     this.offtime = null;
//                     this.ontime = currentTime;
//                     this.userack = "";
//                     console.log(`🚀 Alarm ${this.name} re-triggered.`);
//                     return true;
//                 }
//                 if (this.acktime || this.type === AlarmsTypes.ACTION) {
//                     this.toremove = true;
//                     return true;
//                 }
//                 return false;


                
    
//             case AlarmStatusEnum.ACK:
//                 if (!onRange) {
//                     if (this.offtime === null) {
//                         this.offtime = currentTime;
//                     }
//                     this.status = AlarmStatusEnum.ON;
//                     return true;
//                 }
//                 return false;
//         }
    
//         return false;
//     }
    
    




    
    
// }


// // Define the AlarmsManager class
// class AlarmsManager {
//     runtime: any;
//     alarms: { [key: string]: Alarm[] } = {};
//     status: AlarmsStatusEnum = AlarmsStatusEnum.INIT;
//     events: EventEmitter;
//     private working: boolean = false;
//     private clearAlarms: boolean = false;

//     constructor(runtime: any) {
//         this.runtime = runtime;
//         this.events = new EventEmitter();
//     }

//     // Start monitoring alarms
//     start(): void {
//         console.log("🚀 Alarm Manager Started.");
//         setInterval(() => this.checkStatus(), 3000);
//     }


//     // Remove alarm from processing when acknowledged or disabled



//     // Check the status of alarms
//     private async checkStatus(): Promise<void> {
//         console.log(`📌 Alarm Manager State: ${this.status}`);

//         if (this.working) {
//             console.log("⚠️ Alarm Manager is already processing. Skipping this cycle...");
//             return;
//         }

//         this.working = true;
//         try {
//             switch (this.status) {
//                 case AlarmsStatusEnum.INIT:
//                     console.log("⏳ Initializing alarm system...");
//                     await this.loadPersistedAlarms();
//                     this.status = AlarmsStatusEnum.IDLE;
//                     break;
//                 case AlarmsStatusEnum.IDLE:
//                     console.log("🔍 Processing alarms...");
//                     await this.processAlarms();
//                     break;
//             }
//         } catch (error) {
//             console.error("❌ Error:", error);
//         } finally {
//             this.working = false;
//         }
//     }

//     private async loadPersistedAlarms(): Promise<void> {
//         console.log("📡 Loading alarms from DB...");
//         if (this.clearAlarms) {
//             await prisma.alarm.deleteMany({});
//             this.clearAlarms = false;
//         } else {
//             const alarmsFromDB = await prisma.alarm.findMany({ include: { tag: true } });
//             console.log(`✅ Loaded ${alarmsFromDB.length} alarms.`);

//             this.alarms = alarmsFromDB.reduce((acc: any, alarm: any) => {
//                 console.log(`🛠️ [DB LOAD] Alarm: ${alarm.name}, Status: ${alarm.status}`);

//                 const parsedAlarm = new Alarm(alarm.id, alarm.name, alarm.type, alarm.subproperty, alarm.tag, alarm.status,alarm.isEnabled);
//                 if (!acc[alarm.name]) acc[alarm.name] = [];
//                 acc[alarm.name].push(parsedAlarm);
//                 return acc;
//             }, {});
//         }
//     }

//     async processAlarms(): Promise<void> {
//         console.log("🔄 Checking alarms...");
//         for (const key in this.alarms) {
//             for (const alarm of this.alarms[key]) {
    
//                 console.log(`🔍 Processing Alarm: ${alarm.name}, Status: ${alarm.status}`);
    
//                 const currentTime = new Date().getTime();
//                 const latestTag = await prisma.tag.findUnique({ where: { id: alarm.tag.id } });
//                 const tagValue = latestTag?.value !== null && latestTag?.value !== undefined 
//                     ? parseFloat(latestTag.value) 
//                     : null;
                
//                 console.log(`🔍 Fetching latest tag value for ${alarm.name}: ${tagValue}`);
//                 const dt = alarm.ontime || currentTime; 
//                 console.log(`🔍 Checking alarm: ${alarm.name}, Status: ${alarm.status}, Tag Value: ${tagValue}, Current Time: ${currentTime}`);
    
//                 const changed = await alarm.check(currentTime, dt, tagValue);
//                 console.log(`🔄 Alarm Check Result: ${changed ? "Changed" : "No Change"}`);
    
//                 if (changed) {
//                     await this.handleAlarmUpdate(alarm, alarm);
//                 }
//             }
//         }
//     }
    
    
//     async handleAlarmUpdate(updatedAlarm: Alarm, prevAlarm: Alarm): Promise<void> {
//         console.log(`🔄 Updating Alarm DB: ID=${updatedAlarm.id}, Status=${updatedAlarm.status}, Ontime=${updatedAlarm.ontime}`);
    
//         // Update alarm status in DB
//         await prisma.alarm.update({
//             where: { id: updatedAlarm.id },
//             data: { 
//                 status: updatedAlarm.status, 
//                 ontime: updatedAlarm.ontime ? new Date(updatedAlarm.ontime) : null, 
//                 offtime: updatedAlarm.offtime ? new Date(updatedAlarm.offtime) : null,
//                 isEnabled: updatedAlarm.isEnabled // Ensure enabled status is updated
//             },
//         });
    
//         // Fetch latest tag from DB and update the alarm's reference
//         const updatedTag = await prisma.tag.findUnique({ where: { id: updatedAlarm.tag.id } });
//         if (updatedTag) {
//             updatedAlarm.tag = updatedTag;
//         }
    
        
    
        
    
//         // 🚨 Logic: If alarm is enabled but was previously disabled, start processing it.
   
    
//         this.events.emit("alarmChanged", updatedAlarm);
//     }
    
    
    

//     private handleAlarmActions(alarm: Alarm): void {
//         console.log(`⚡ Handling actions for alarm: ${alarm.name}`);
//     }
// }







// const alarmManager = new AlarmsManager({});
// export default alarmManager;









