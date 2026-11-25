/*
 * I2C scanner for the bench test.
 *
 * With the XIAO Logger HAT fitted, expect:
 *   0x23  BH1750 light sensor
 *   0x44  SHT40 temperature and humidity sensor
 *   0x51  PCF8563 real-time clock
 *
 * The HAT sensors are powered from D10 (GPIO18), so the scanner drives it HIGH.
 * If nothing appears, check the HAT solder joints and the XIAO 3V3/GND pins.
 */

#include <Wire.h>

static const int I2C_SDA = 22;
static const int I2C_SCL = 23;
static const int SENSOR_POWER = 18;

static const char *nameFor(uint8_t address)
{
  switch (address) {
    case 0x23: return "BH1750 light sensor";
    case 0x44: return "SHT40 temperature and humidity";
    case 0x51: return "PCF8563 real-time clock";
    default: return "unknown";
  }
}

void setup()
{
  Serial.begin(115200);
  delay(1500);

  pinMode(SENSOR_POWER, OUTPUT);
  digitalWrite(SENSOR_POWER, HIGH);
  delay(20);

  Wire.begin(I2C_SDA, I2C_SCL);

  Serial.println();
  Serial.println("I2C scan on GPIO22 (SDA) / GPIO23 (SCL), D10 (GPIO18) HIGH");

  for (uint8_t address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.printf("Found device at 0x%02X (%s)\n", address, nameFor(address));
    }
  }

  Serial.println("Scan done. Expect 0x23, 0x44 and 0x51 with the Logger HAT.");
}

void loop()
{
  delay(1000);
}
