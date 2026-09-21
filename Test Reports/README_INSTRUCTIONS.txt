========================================================================
INDUSTRIAL MACHINE LOG INTEGRITY CHECKER — TEST REPORTS DEMO PACK
========================================================================

HOW TO DEMONSTRATE:
-------------------
1. In the Web Dashboard (http://localhost:5000):
   - Under "Original Machine Log", click [Upload File]
   - Select any of these 10 reports from this folder.
   - Click [Compute CRC].
   - Observe Step 1 to Step 5 calculations.

2. Testing Authentic Verification (✓ ACCEPT):
   - Upload the SAME report file into "Received Log & Verification" via [Upload File].
   - Click [Verify Integrity].
   - Result: Remainder is 32 zeros -> [✓ ACCEPT].

3. Testing Tampering / Noise Detection (✗ REJECT):
   - Change any single letter or number in the received text (e.g. change 842.6C to 842.7C).
   - Click [Verify Integrity].
   - Result: Non-zero remainder -> [✗ REJECT: Data Corrupted / Tampered].

LIST OF TEST REPORTS:
---------------------
01. Report_01_Turbine_Pressure_Telemetry.log
02. Report_02_CNC_Spindle_Vibration_Audit.txt
03. Report_03_SCADA_HighVoltage_Breaker_Trip.log
04. Report_04_Robotic_Arm_6DOF_Kinematics.txt
05. Report_05_Industrial_Boiler_Combustion_Exhaust.log
06. Report_06_Hydraulic_Press_Force_Profile.txt
07. Report_07_Centrifugal_Compressor_Surge_Log.log
08. Report_08_Automated_Conveyor_Encoder_Telemetry.txt
09. Report_09_Emergency_Diesel_Generator_Telemetry.log
10. Report_10_PLC_Safety_Interlock_Trip_Event.txt
========================================================================
