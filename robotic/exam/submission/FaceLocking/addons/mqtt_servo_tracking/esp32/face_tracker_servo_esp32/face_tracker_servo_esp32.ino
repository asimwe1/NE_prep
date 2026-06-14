#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>

// Wi-Fi settings
const char* WIFI_SSID = "EdNet";
const char* WIFI_PASSWORD = "Huawei@123";

// MQTT settings
const char* MQTT_SERVER = "157.173.101.159";
const uint16_t MQTT_PORT = 1883;
const char* MQTT_TOPIC = "vision/teamalpha/movement";
const char* MQTT_CLIENT_ID = "teamalpha-face-servo-esp32";

// Servo configuration
const uint8_t SERVO_PIN = 18;
const int SERVO_MIN_ANGLE = 0;
const int SERVO_MAX_ANGLE = 180;
const int SERVO_CENTER_ANGLE = 90;
const int TRACK_STEP = 1;
const int SEARCH_STEP = 1;
const unsigned long TRACK_INTERVAL_MS = 140;
const unsigned long SEARCH_INTERVAL_MS = 220;

const bool REVERSE_SERVO = true;

enum MovementCommand {
  CMD_IDLE,
  CMD_LEFT,
  CMD_RIGHT,
  CMD_CENTER,
  CMD_SEARCH
};

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
Servo panServo;

MovementCommand currentCommand = CMD_IDLE;
int servoAngle = SERVO_CENTER_ANGLE;
int sweepDirection = 1;
unsigned long lastMoveAt = 0;
unsigned long lastReconnectAttempt = 0;
unsigned long lastCommandAt = 0;

void setServoAngle(int angle) {
  angle = constrain(angle, SERVO_MIN_ANGLE, SERVO_MAX_ANGLE);
  if (angle == servoAngle) return;
  servoAngle = angle;
  panServo.write(servoAngle);
}

void applyTrackingStep(int logicalDirection) {
  int direction = REVERSE_SERVO ? -logicalDirection : logicalDirection;
  setServoAngle(servoAngle + (direction * TRACK_STEP));
}

MovementCommand parseCommand(String message) {
  message.trim();
  message.toUpperCase();

  if (message.startsWith("CMD_")) {
    message = message.substring(4);
  }

  if (message == "LEFT") return CMD_LEFT;
  if (message == "RIGHT") return CMD_RIGHT;
  if (message == "CENTER") return CMD_CENTER;
  if (message == "SEARCH") return CMD_SEARCH;
  return CMD_IDLE;
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  currentCommand = parseCommand(message);
  lastCommandAt = millis();

  Serial.print("[MQTT] Received: ");
  Serial.println(message);
  Serial.print("[MQTT] Active command: ");
  Serial.println((int)currentCommand);
}

void handleSerial() {
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    MovementCommand newCmd = parseCommand(input);

    if (newCmd != CMD_IDLE || input.indexOf("IDLE") >= 0) {
      currentCommand = newCmd;
      lastCommandAt = millis();
      Serial.print("[SERIAL] Executing: ");
      Serial.println(input);
    }
  }
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("[WiFi] Connecting");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected");
  } else {
    Serial.println("\n[WiFi] Failed");
  }
}

bool connectMqtt() {
  if (mqttClient.connected()) return true;

  if (millis() - lastReconnectAttempt < 5000) return false;
  lastReconnectAttempt = millis();

  Serial.print("[MQTT] Connecting...");
  if (!mqttClient.connect(MQTT_CLIENT_ID)) {
    Serial.print(" Failed, rc=");
    Serial.println(mqttClient.state());
    return false;
  }

  Serial.println(" Connected");
  mqttClient.subscribe(MQTT_TOPIC);
  return true;
}

void handleServo() {
  unsigned long now = millis();

  if (currentCommand == CMD_CENTER) {
    // Hold current position when the target is centered. Snapping back to a
    // fixed 90-degree angle causes visible shaking and overshoot.
    return;
  }

  if (currentCommand == CMD_SEARCH) {
    if (now - lastMoveAt < SEARCH_INTERVAL_MS) return;
    lastMoveAt = now;

    setServoAngle(servoAngle + (sweepDirection * SEARCH_STEP));
    if (servoAngle >= SERVO_MAX_ANGLE) sweepDirection = -1;
    if (servoAngle <= SERVO_MIN_ANGLE) sweepDirection = 1;
    return;
  }

  if (now - lastMoveAt < TRACK_INTERVAL_MS) return;
  lastMoveAt = now;

  if (currentCommand == CMD_LEFT) applyTrackingStep(-1);
  else if (currentCommand == CMD_RIGHT) applyTrackingStep(1);
}

void setup() {
  Serial.begin(115200);
  delay(10);
  Serial.println("\n[SYS] Team Alpha Face-Servo Initializing (ESP32)...");

  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  panServo.setPeriodHertz(50);
  panServo.attach(SERVO_PIN, 500, 2400);
  setServoAngle(SERVO_CENTER_ANGLE);

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);

  connectWiFi();
  lastCommandAt = millis();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMqtt();

  mqttClient.loop();
  handleSerial();
  handleServo();

  delay(2);
}
