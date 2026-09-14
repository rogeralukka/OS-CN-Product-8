# Industrial Machine Log Integrity Checker

A web application designed for verifying industrial machine log telemetry integrity using **hand-written Modulo-2 binary polynomial division (CRC-32)** with a session-fixed 33-bit generator polynomial.

---

## 📁 Project Structure

```
Industrial-Machine-Log-Integrity-Checker/
├── backend/
│   ├── app.py              # Flask server with /api/compute, /api/verify, and /api/divisor
│   ├── crc_checker.py      # Session-level 33-bit polynomial generator & XOR division
│   └── requirements.txt    # Flask, Flask-Cors
├── frontend/
│   ├── index.html          # 2-Row layout (inputs top, process steps bottom)
│   ├── style.css           # AEGIS-inspired theme tokens & custom 6px scrollbars
│   └── script.js           # Frontend controller for compute, verify, and step rendering
└── README.md               # Architecture details, CRC math & Viva guide
```

---

## 🔬 Core CRC Concepts (For Viva)

### 1. `ascii2binary(text)`
Converts each character of the log message into an 8-bit binary representation:
$$\text{'A'} \to \mathtt{01000001}$$

### 2. `generate_divisor()` & `get_divisor()`
- Generates a **33-bit divisor** where the first and last bits are strictly `1`:
  $$\text{Example: } \mathtt{100001010100110001101111101000111} \quad (\text{Length: } 33 \text{ bits})$$
- Divisor is fixed **ONCE** at startup per session so that sender (compute) and receiver (verify) always use the exact same generator.

### 3. `xordiv(dividend, divisor)` (Modulo-2 Division)
Performs bit-by-bit XOR long division across the dividend. The **remainder is strictly the last 32 bits**.

### 4. Sender vs Receiver Flow
- **Sender (`compute_crc`)**:
  1. $M = \text{ascii2binary}(\text{text})$
  2. $\text{Padded} = M + \mathtt{"0"} \times 32$
  3. $\text{Remainder} = \text{xordiv}(\text{Padded}, \text{Divisor})$ $\to$ (This is the 32-bit CRC)
- **Receiver (`verify`)**:
  1. $M' = \text{ascii2binary}(\text{text})$
  2. $\text{Codeword} = M' + \text{Received CRC}$
  3. $\text{Remainder} = \text{xordiv}(\text{Codeword}, \text{Divisor})$
  4. If $\text{Remainder} == \mathtt{"0"} \times 32 \to \mathbf{ACCEPT}$, otherwise $\mathbf{REJECT}$.

---

## 📡 API Endpoints

### 1. `POST /api/compute`
* **Request**: `{"log": "<original text>"}`
* **Response**:
  ```json
  {
    "crc": "01001001011001001010011100011011",
    "divisor": "100001010100110001101111101000111",
    "steps": {
      "original_text": "...",
      "binary": "010101...",
      "padded": "010101...00000000000000000000000000000000",
      "divisor": "100001010100110001101111101000111",
      "remainder": "01001001011001001010011100011011",
      "hex": "4964A71B"
    }
  }
  ```

### 2. `POST /api/verify`
* **Request**: `{"log": "<received text>", "crc": "<32-bit string>"}`
* **Response**:
  ```json
  {
    "accepted": true,
    "divisor": "100001010100110001101111101000111",
    "steps": {
      "received_text": "...",
      "binary": "010101...",
      "codeword": "010101...01001001011001001010011100011011",
      "divisor": "100001010100110001101111101000111",
      "remainder": "00000000000000000000000000000000"
    }
  }
  ```

---

## 🚀 How to Run

```bash
# 1. Start Flask backend
python backend/app.py

# 2. Open dashboard in browser
http://localhost:5000
```
