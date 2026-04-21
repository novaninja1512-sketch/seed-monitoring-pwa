#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ---------------- WIFI ----------------
const char* ap_ssid = "seed";
const char* ap_password = "12345678";

const char* sta_ssid = "tushar";          // 👉 mobile hotspot / router
const char* sta_password = "Tushar123";

// ---------------- SUPABASE ----------------
// 👉 CHANGED: We now push directly to the single machine_state row!
const String SUPABASE_URL = "https://jhjdkqyneumjkyvolcga.supabase.co/rest/v1/machine_state?id=eq.1";
const String SUPABASE_KEY = "sb_publishable_vyp5xHKWOixWAs6KgHfKTQ_FHzpFKEZ";

WebServer server(80);

// ---------------- PINS ----------------
#define IR1 15
#define IR2 23
#define IR3 14
#define IR4 27
#define IR5 26
#define IR6 39

#define TRIG 33
#define ECHO 32
#define BUZZER 4

#define ENCODER_A 18
#define ENCODER_B 19

// ---------------- VARIABLES ----------------
volatile bool f1=false,f2=false,f3=false,f4=false,f5=false,f6=false;

int c1=0,c2=0,c3=0,c4=0,c5=0,c6=0;
int totalSeeds = 0;

unsigned long t1=0,t2=0,t3=0,t4=0,t5=0,t6=0;

float distanceCM = 0;
int levelPercent = 0;

volatile int encoderCount = 0;
float meter = 0;

unsigned long lastUpdate = 0;

// ---------------- IR INTERRUPTS ----------------
void IRAM_ATTR ir1(){ f1=true; }
void IRAM_ATTR ir2(){ f2=true; }
void IRAM_ATTR ir3(){ f3=true; }
void IRAM_ATTR ir4(){ f4=true; }
void IRAM_ATTR ir5(){ f5=true; }
void IRAM_ATTR ir6(){ f6=true; }

// ---------------- ENCODER ----------------
void IRAM_ATTR encoderISR() {
  if (digitalRead(ENCODER_B)) encoderCount++;
  else encoderCount--;
}

// ---------------- ULTRASONIC ----------------
float getDistance() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  long duration = pulseIn(ECHO, HIGH, 30000);
  return duration * 0.034 / 2;
}

// ---------------- WEB ----------------
void handleRoot() {
  String page = "<html><body>";
  page += "<h2>Total Seeds: " + String(totalSeeds) + "</h2>";
  page += "<h3>IR1:"+String(c1)+" IR2:"+String(c2)+" IR3:"+String(c3)+"</h3>";
  page += "<h3>IR4:"+String(c4)+" IR5:"+String(c5)+" IR6:"+String(c6)+"</h3>";
  page += "<h3>Level: "+String(levelPercent)+"%</h3>";
  page += "<h3>Distance: "+String(meter)+" m</h3>";
  page += "</body></html>";
  server.send(200, "text/html", page);
}

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);

  pinMode(IR1, INPUT_PULLUP);
  pinMode(IR2, INPUT_PULLUP);
  pinMode(IR3, INPUT_PULLUP);
  pinMode(IR4, INPUT_PULLUP);
  pinMode(IR5, INPUT_PULLUP);
  pinMode(IR6, INPUT_PULLUP);

  attachInterrupt(IR1, ir1, FALLING);
  attachInterrupt(IR2, ir2, FALLING);
  attachInterrupt(IR3, ir3, FALLING);
  attachInterrupt(IR4, ir4, FALLING);
  attachInterrupt(IR5, ir5, FALLING);
  attachInterrupt(IR6, ir6, FALLING);

  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(BUZZER, OUTPUT);

  pinMode(ENCODER_A, INPUT);
  pinMode(ENCODER_B, INPUT);
  attachInterrupt(ENCODER_A, encoderISR, RISING);

  // WIFI MODE
  WiFi.mode(WIFI_AP_STA);

  // HOTSPOT
  WiFi.softAP(ap_ssid, ap_password);
  Serial.println("Hotspot Started: seed");
  Serial.print("AP IP: ");
  Serial.println(WiFi.softAPIP());

  // CONNECT INTERNET WIFI
  WiFi.begin(sta_ssid, sta_password);

  Serial.print("Connecting to WiFi");
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 20) {
    delay(500);
    Serial.print(".");
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected to Internet");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nNo Internet (Only Local Mode)");
  }

  server.on("/", handleRoot);
  server.begin();
}

// ---------------- LOOP ----------------
void loop() {
  server.handleClient();

  unsigned long now = millis();

  // -------- IR FIX --------
  if(f1 && now-t1>1200){ c1++; f1=false; t1=now; }
  if(f2 && now-t2>1300){ c2++; f2=false; t2=now; }
  if(f3 && now-t3>1200){ c3++; f3=false; t3=now; }
  if(f4 && now-t4>1200){ c4++; f4=false; t4=now; }
  if(f5 && now-t5>1200){ c5++; f5=false; t5=now; }
  if(f6 && now-t6>1200){ c6++; f6=false; t6=now; }

  totalSeeds = c1+c2+c3+c4+c5+c6;

  // -------- ULTRASONIC --------
  distanceCM = getDistance();
  levelPercent = map(distanceCM, 30, 4, 0, 100);
  levelPercent = constrain(levelPercent, 0, 100);

  // -------- BUZZER --------
  if(levelPercent <= 30) digitalWrite(BUZZER, HIGH);
  else digitalWrite(BUZZER, LOW);

  // -------- ENCODER --------
  meter = (encoderCount / 20.0) * 0.20;

  // -------- SERIAL --------
  Serial.println("------ DATA ------");
  Serial.print("Total: "); Serial.println(totalSeeds);
  Serial.printf("IR1:%d IR2:%d IR3:%d IR4:%d IR5:%d IR6:%d\n",c1,c2,c3,c4,c5,c6);
  Serial.print("Level: "); Serial.println(levelPercent);
  Serial.print("Meter: "); Serial.println(meter);

  // -------- SUPABASE --------
  if (WiFi.status() == WL_CONNECTED) {
    if (millis() - lastUpdate > 3000) {
      updateSupabase();
      lastUpdate = millis();
    }
  }
}

// ---------------- SUPABASE ----------------
void updateSupabase() {

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;

  if (https.begin(client, SUPABASE_URL)) {

    https.addHeader("Content-Type", "application/json");
    https.addHeader("apikey", SUPABASE_KEY);
    https.addHeader("Authorization", "Bearer " + SUPABASE_KEY);

    // 👉 CHANGED: We now pack ALL metrics perfectly into a single payload
    String payload = "{";
    payload += "\"c1\":" + String(c1) + ",";
    payload += "\"c2\":" + String(c2) + ",";
    payload += "\"c3\":" + String(c3) + ",";
    payload += "\"c4\":" + String(c4) + ",";
    payload += "\"c5\":" + String(c5) + ",";
    payload += "\"c6\":" + String(c6) + ",";
    payload += "\"level_percent\":" + String(levelPercent) + ",";
    payload += "\"distance_m\":" + String(meter);
    payload += "}";

    int httpCode = https.PATCH(payload);

    Serial.print("Supabase Web Sync HTTP Code: ");
    Serial.println(httpCode);

    https.end();
  } else {
    Serial.println("HTTPS failed");
  }
}
