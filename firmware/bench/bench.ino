/*
 * Window Weather Sensor - bench test
 *
 * Hardware:
 *   Seeed XIAO ESP32-C6
 *   Seeed XIAO Logger HAT (Sensirion SHT40 + BH1750 + PCF8563 RTC)
 *
 * The HAT sits on the XIAO pins, so there are no wires:
 *   D4 (GPIO22)  SDA   shared I2C bus: SHT40 0x44, BH1750 0x23, RTC 0x51
 *   D5 (GPIO23)  SCL
 *   D10 (GPIO18) powers the HAT sensors; it must be HIGH before they are used
 *
 * This sketch is intentionally simple:
 *   - Matter over Wi-Fi (USB powered)
 *   - temperature + humidity endpoints
 *   - one reading every 5 seconds
 *
 * The final window firmware uses Thread and reports every 1-2 hours.
 */

#include <Arduino.h>
#include <Matter.h>
#include <Wire.h>
#include <Adafruit_SHT4x.h>

static const int I2C_SDA = 22;
static const int I2C_SCL = 23;
static const int SENSOR_POWER = 18;

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
  Serial.println("Window sensor bench test");

  pinMode(SENSOR_POWER, OUTPUT);
  digitalWrite(SENSOR_POWER, HIGH);
  delay(20);

  Wire.begin(I2C_SDA, I2C_SCL);

  if (!sht4.begin(&Wire)) {
    Serial.println("SHT40 not found. Check the Logger HAT solder joints.");
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
  Matter.setDeviceName("Window Sensor");
  Matter.setVendorName("DIY");
  Matter.setProductName("Window Weather Sensor");

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
