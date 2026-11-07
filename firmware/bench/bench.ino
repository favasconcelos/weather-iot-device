/*
 * Garden Weather Sensor - bench test
 *
 * Hardware:
 *   Seeed XIAO ESP32-C6
 *   Sensirion SHT40 breakout (Adafruit #4885 or similar)
 *
 * Wiring:
 *   XIAO 3V3  -> SHT40 VIN/VCC
 *   XIAO GND  -> SHT40 GND
 *   XIAO D4   -> SHT40 SDA   (GPIO22)
 *   XIAO D5   -> SHT40 SCL   (GPIO23)
 *
 * This sketch is intentionally simple:
 *   - Matter over Wi-Fi (USB powered)
 *   - temperature + humidity endpoints
 *   - one reading every 5 seconds
 *
 * The final outdoor firmware uses Thread and deep sleep instead.
 */

#include <Arduino.h>
#include <Matter.h>
#include <Wire.h>
#include <Adafruit_SHT4x.h>

static const int I2C_SDA = 22;
static const int I2C_SCL = 23;

MatterTemperatureSensor temperatureSensor;
MatterHumiditySensor humiditySensor;
Adafruit_SHT4x sht4;

static void printOneReading()
{
  sensors_event_t humidity, temp;
  if (sht4.getEvent(&humidity, &temp)) {
    Serial.printf("First reading: %.2f C, %.2f %%RH\n",
                  temp.temperature, humidity.relative_humidity);
  } else {
    Serial.println("First reading failed.");
  }
}

void setup()
{
  Serial.begin(115200);
  delay(1500);
  Serial.println();
  Serial.println("Garden sensor bench test");

  Wire.begin(I2C_SDA, I2C_SCL);

  if (!sht4.begin(&Wire)) {
    Serial.println("SHT40 not found. Check wiring.");
  } else {
    Serial.println("SHT40 found.");
  }

  sht4.setPrecision(SHT4X_HIGH_PRECISION);
  sht4.setHeater(SHT4X_NO_HEATER);

  printOneReading();

  /* Use Wi-Fi for the bench test. The final firmware uses Thread. */
  Matter.selectNetwork(MATTER_NETWORK_WIFI);

  /* Create the two Matter endpoints. */
  temperatureSensor.begin(0.0);
  humiditySensor.begin(0.0);

  /* Optional identity. Safe before Matter.begin(). */
  Matter.setDeviceName("Garden Sensor");
  Matter.setVendorName("DIY");
  Matter.setProductName("Garden Weather Sensor");

  Matter.begin();

  Serial.print("Manual pairing code: ");
  Serial.println(Matter.getManualPairingCode());
  Serial.print("QR code URL: ");
  Serial.println(Matter.getOnboardingQRCodeUrl());

  /* Wait forever for pairing during the bench test. */
  matterWaitUntilReady(0);

  Serial.println("Matter ready.");
}

void loop()
{
  static uint32_t lastRead = 0;

  if (millis() - lastRead >= 5000) {
    lastRead = millis();

    sensors_event_t humidity, temp;
    if (sht4.getEvent(&humidity, &temp)) {
      temperatureSensor.setTemperature(temp.temperature);
      humiditySensor.setHumidity(humidity.relative_humidity);

      Serial.printf("Temperature: %.2f C  Humidity: %.2f %%\n",
                    temp.temperature, humidity.relative_humidity);
    } else {
      Serial.println("Sensor read failed.");
    }
  }

  delay(50);
}
