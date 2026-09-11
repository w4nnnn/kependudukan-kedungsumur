import "dotenv/config";
import { encryptAesGcm, decryptAesGcm } from "../../src/db/schema/schema.js";
import { assert, assertEqual } from "./assertions.js";

async function run() {
  console.log("Menjalankan test enkripsi dan dekripsi AES-256-GCM...");

  const originalText = "3573010101900001";
  const encrypted = encryptAesGcm(originalText);
  const decrypted = decryptAesGcm(encrypted);
  assertEqual(decrypted, originalText, "Enkripsi dan dekripsi roundtrip harus cocok");

  const nonStringInput: any = 12345;
  const encryptedNonString = encryptAesGcm(nonStringInput);
  assertEqual(encryptedNonString, nonStringInput, "Non-string input pada encryptAesGcm dikembalikan aman");

  const dashText = "-";
  assertEqual(decryptAesGcm(dashText), dashText, "Plaintext '-' tidak boleh crash");

  const corruptBase64 = Buffer.alloc(32, 0x41).toString("base64");
  let threw = false;
  try {
    decryptAesGcm(corruptBase64);
  } catch (err: any) {
    threw = true;
    assert(
      err.message.includes("Gagal mendekripsi data"),
      `Pesan error harus informatif, diterima: ${err.message}`
    );
  }

  assert(
    threw,
    "Ciphertext rusak HARUS melempar error (throw), bukan mengembalikan string base64 mentah yang memicu data poisoning"
  );

  console.log("✅ All encryption tests passed!");
}

run().catch((err) => {
  console.error("❌ Test failed:", err.message);
  process.exit(1);
});
