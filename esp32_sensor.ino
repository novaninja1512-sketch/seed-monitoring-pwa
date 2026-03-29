#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// --- A) LOCAL HOTSPOT (Connect here with your phone when out in the field offline) ---
const char* ap_ssid = "SeedMonitor";
const char* ap_password = "12345678";

// --- B) INTERNET WIFI (Used to push data upwards to your new Web App Dashboard) ---
const char* sta_ssid = "YOUR_WIFI_NAME";
const char* sta_password = "YOUR_WIFI_PASSWORD";

// --- C) SUPABASE CLOUD PWA CONFIG ---
const String SUPABASE_URL = "https://jhjdkqyneumjkyvolcga.supabase.co/rest/v1/seed_counts?outlet_id=eq.1";
const String SUPABASE_KEY = "sb_publishable_vyp5xHKWOixWAs6KgHfKTQ_FHzpFKEZ";

WebServer server(80);

int seedCount = 0;
const int irSensor = 14;
const int buzzer = 27;

bool detected = false;
unsigned long lastUpdate = 0;
int lastSentCount = -1;

// Webpage with auto refresh (Your original interface!)
void handleRoot() {
  String page = "<html><head>";
  page += "<meta http-equiv='refresh' content='1'>";
  // Giving it slightly nicer styling while keeping it identical to what you wrote
  page += "</head><body style='font-family: Arial, sans-serif; text-align: center; margin-top: 50px;'>";

  page += "<h1 style='color:green;'>Seed Monitoring System (Local)</h1>";
  page += "<h2>Total Seeds Dropped: <span style='color: blue;'>";
  page += seedCount;
  page += "</span></h2>";
  
  // Added a nice cloud-status indicator for you
  page += "<br/><p style='font-size: 14px; font-weight: bold;'>Cloud Sync Status: ";
  if (WiFi.status() == WL_CONNECTED) {
    page += "<span style='color: green;'>Online (Syncing to Web PWA 🟢)</span></p>";
  } else {
    page += "<span style='color: red;'>Offline-Only (No Internet Found 🔴)</span></p>";
  }

  page += "</body></html>";
  server.send(200, "text/html", page);
}

void setup() {
  Serial.begin(115200);

  pinMode(irSensor, INPUT);
  pinMode(buzzer, OUTPUT);

  // Set ESP32 to Hybrid Dual-Mode (Access Point + Station at the same time)
  WiFi.mode(WIFI_AP_STA);
  
  // 1. Start your Local Hotspot
  WiFi.softAP(ap_ssid, ap_password);
  Serial.println("--- Local Hotspot Started ---");
  Serial.print("Local Offline IP: ");
  Serial.println(WiFi.softAPIP());

  // 2. Start trying to connect to the Internet Router
  WiFi.begin(sta_ssid, sta_password);
  Serial.print("Attempting to connect to Cloud Wi-Fi...");

  // Don't freeze forever if there is no internet. Just try for 5 seconds.
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 10) {
    delay(500);
    Serial.print(".");
    tries++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nSUCCESS: Cloud Mode Active! Connected to Internet.");
  } else {
    Serial.println("\nCAUTION: No Internet found. Working in Local-Only Mode.");
  }

  // 3. Start Local Web Server
  server.on("/", handleRoot);
  server.begin();
}

void loop() {
  // Always serve your old local website regardless of internet
  server.handleClient();

  int sensorValue = digitalRead(irSensor);

  // Detect seed
  if (sensorValue == LOW && !detected) {
    seedCount++;
    detected = true;

    digitalWrite(buzzer, HIGH);
    delay(30); 
    digitalWrite(buzzer, LOW);

    Serial.print("Seed Count: ");
    Serial.println(seedCount);
  }

  if (sensorValue == HIGH) {
    detected = false;
  }

  // ONLY sync to the new PWA Dashboard if the router has given us internet
  if (WiFi.status() == WL_CONNECTED) {
    if (seedCount != lastSentCount && millis() - lastUpdate > 2000) {
      updateSupabase(seedCount);
      lastSentCount = seedCount;
      lastUpdate = millis();
    }
  }
}

void updateSupabase(int count) {
  WiFiClientSecure *client = new WiFiClientSecure;
  client->setInsecure(); 

  HTTPClient https;
  
  if (https.begin(*client, SUPABASE_URL)) {
    https.addHeader("Content-Type", "application/json");
    https.addHeader("apikey", SUPABASE_KEY);
    https.addHeader("Authorization", "Bearer " + SUPABASE_KEY);
    
    // Patch outlet #1
    String payload = "{\"current_count\":" + String(count) + ", \"flow_rate\":0, \"status\":\"healthy\"}";
                     
    int httpResponseCode = https.PATCH(payload);
    
    if (httpResponseCode > 0) {
      Serial.print("Cloud Synced: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Cloud Sync Error: ");
      Serial.println(https.errorToString(httpResponseCode).c_str());
    }
    https.end();
  }
  
  delete client; 
}
