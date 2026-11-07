/*
 * I2C scanner for the bench test.
 *
 * The SHT40 should appear at 0x44.
 * If nothing appears, check power and the SDA/SCL wiring.
 */

#include <Wire.h>

static const int I2C_SDA = 22;
static const int I2C_SCL = 23;

void setup()
{
  Serial.begin(115200);
  delay(1500);

  Wire.begin(I2C_SDA, I2C_SCL);

  Serial.println();
  Serial.println("I2C scan on GPIO22 (SDA) / GPIO23 (SCL)");

  for (uint8_t address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.printf("Found device at 0x%02X\n", address);
    }
  }

  Serial.println("Scan done. The SHT40 should be at 0x44.");
}

void loop()
{
  delay(1000);
}
