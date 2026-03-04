const Notifications = require("expo-notifications");

async function testTrigger() {
  console.log("Testing trigger with SchedulableTriggerInputTypes.DATE");

  try {
    const triggerDate = new Date();
    triggerDate.setSeconds(triggerDate.getSeconds() + 10);

    // Test 1: Using type
    console.log("\n--- Test 1: Date + type ---");
    const trigger1 = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    };
    console.log(trigger1);

    // Test 2: Using channelId
    console.log("\n--- Test 2: Date + channelId ---");
    const trigger2 = {
      date: triggerDate,
      channelId: "task-reminders-v5",
    };
    console.log(trigger2);

    // Test 3: Using time interval
    console.log("\n--- Test 3: TimeInterval ---");
    const trigger3 = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60,
      repeats: false,
    };
    console.log(trigger3);
  } catch (error) {
    console.error("Error:", error);
  }
}

testTrigger();
