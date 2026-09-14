"""
crc_checker.py
==============
Industrial Machine Log Integrity Checker

Session-based 33-bit Polynomial Modulo-2 Division (Hand-written XOR Division)

Concept:
1. ascii2binary(text): Converts text/file string to an 8-bit binary representation.
2. generate_divisor(): Generates a session-fixed 33-bit polynomial key (starts and ends with '1').
3. xordiv(dividend, divisor): Performs XOR modulo-2 long division and returns the last 32-bit remainder.
4. compute_crc(text): Pads binary with 32 zeros, computes division remainder (CRC-32).
5. verify(text, received_crc): Appends received CRC to binary data, verifies if remainder == 32 zeros.
"""

import random

# Session-level fixed generator polynomial (33-bit)
GENERATOR = None


def generate_divisor() -> str:
    """
    Generates a 33-bit divisor for standard CRC-32 modulo-2 division.
    First and last bits are '1' for a valid CRC generator polynomial.
    """
    middle = "".join(random.choice("01") for _ in range(31))
    return "1" + middle + "1"


def get_divisor() -> str:
    """
    Returns the session-fixed generator polynomial.
    Generated once on startup and reused throughout the entire session.
    """
    global GENERATOR
    if GENERATOR is None:
        GENERATOR = generate_divisor()
    return GENERATOR


def ascii2binary(text: str) -> str:
    """
    Converts ASCII/UTF-8 text to a continuous stream of 8-bit binary strings.
    """
    result = ""
    for ch in text:
        result += f"{ord(ch):08b}"
    return result


def binary_to_hex(binary_str: str) -> str:
    """
    Converts binary string to uppercase hexadecimal string.
    """
    if not binary_str:
        return "00000000"
    num = int(binary_str, 2)
    hex_len = (len(binary_str) + 3) // 4
    return format(num, f"0{hex_len}X")


def xordiv(dividend: str, divisor: str) -> str:
    """
    Performs Modulo-2 XOR binary division.
    Returns the 32-bit remainder (the last len(divisor)-1 bits).
    """
    d = list(dividend)
    m = len(divisor)
    
    for i in range(len(d) - m + 1):
        if d[i] == "1":
            for j in range(m):
                d[i + j] = "1" if d[i + j] != divisor[j] else "0"
                
    # The remainder is strictly the last (m - 1) bits -> 32 bits
    return "".join(d[-(m - 1):])


def compute_crc(text: str) -> dict:
    """
    SENDER SIDE:
    Step 1: text -> ascii2binary
    Step 2: Append 32 zeros (padding)
    Step 3: xordiv(padded_binary, divisor) -> remainder (CRC)
    """
    divisor = get_divisor()
    
    if not text:
        zero_crc = "0" * (len(divisor) - 1)
        return {
            "crc": zero_crc,
            "divisor": divisor,
            "steps": {
                "original_text": "",
                "binary": "",
                "padded": "0" * 32,
                "divisor": divisor,
                "remainder": zero_crc,
                "hex": "00000000"
            }
        }

    binary_data = ascii2binary(text)
    padded_data = binary_data + ("0" * (len(divisor) - 1))
    remainder = xordiv(padded_data, divisor)
    hex_str = binary_to_hex(remainder)

    return {
        "crc": remainder,
        "divisor": divisor,
        "steps": {
            "original_text": text,
            "binary": binary_data,
            "padded": padded_data,
            "divisor": divisor,
            "remainder": remainder,
            "hex": hex_str
        }
    }


def verify(text: str, received_crc: str) -> dict:
    """
    RECEIVER SIDE:
    Step 1: text -> ascii2binary
    Step 2: codeword = binary + received_crc
    Step 3: xordiv(codeword, divisor) -> remainder
    Step 4: if remainder == 32 zeros -> ACCEPT else REJECT
    """
    divisor = get_divisor()
    clean_crc = str(received_crc).strip()

    # Handle hex input if 8 hex chars given
    if len(clean_crc) == 8 and all(c in "0123456789abcdefABCDEF" for c in clean_crc):
        clean_crc = format(int(clean_crc, 16), "032b")

    expected_len = len(divisor) - 1

    if len(clean_crc) != expected_len or not all(c in "01" for c in clean_crc):
        binary_data = ascii2binary(text)
        return {
            "accepted": False,
            "divisor": divisor,
            "steps": {
                "received_text": text,
                "binary": binary_data,
                "codeword": binary_data + clean_crc,
                "divisor": divisor,
                "remainder": "INVALID_CRC_LENGTH"
            }
        }

    binary_data = ascii2binary(text)
    codeword = binary_data + clean_crc
    remainder = xordiv(codeword, divisor)
    is_accepted = remainder == ("0" * expected_len)

    return {
        "accepted": is_accepted,
        "divisor": divisor,
        "steps": {
            "received_text": text,
            "binary": binary_data,
            "codeword": codeword,
            "divisor": divisor,
            "remainder": remainder
        }
    }


if __name__ == "__main__":
    print(f"Session Divisor: {get_divisor()} (Length: {len(get_divisor())} bits)")
    sample = "[2026-09-14 22:00:00] MACHINE_01 RPM:3200 TEMP:75.0C STATUS:OK"
    res = compute_crc(sample)
    print(f"Computed CRC: {res['crc']}")
    
    # Valid verification
    v1 = verify(sample, res["crc"])
    print(f"Verify Valid: {v1['accepted']} (Remainder: {v1['steps']['remainder']})")
    assert v1["accepted"] is True
    
    # Tampered verification
    tampered = "[2026-09-14 22:00:00] MACHINE_01 RPM:3201 TEMP:75.0C STATUS:OK"
    v2 = verify(tampered, res["crc"])
    print(f"Verify Tampered: {v2['accepted']} (Remainder: {v2['steps']['remainder']})")
    assert v2["accepted"] is False
    print("Self-test passed successfully!")
