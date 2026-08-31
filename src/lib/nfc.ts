/**
 * Web NFC Helper Service
 * Exclusively handles in-browser RFID/NFC scanning with explicit user permission activation
 */

export interface NfcScanResult {
  serialNumber: string;
  records?: Array<{
    recordType: string;
    mediaType?: string;
    id?: string;
    data?: string;
  }>;
}

export function isWebNfcSupported(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

export class NfcScannerService {
  private ndef: any = null;
  private abortController: AbortController | null = null;
  private isScanning = false;

  /**
   * Request user permission and start NFC reader scanning
   */
  async startScan(
    onReading: (result: NfcScanResult) => void,
    onError?: (error: Error) => void
  ): Promise<boolean> {
    if (!isWebNfcSupported()) {
      if (onError) onError(new Error("Perangkat atau browser ini tidak mendukung sensor Web NFC."));
      return false;
    }

    try {
      this.stopScan();

      this.abortController = new AbortController();
      // @ts-ignore
      this.ndef = new window.NDEFReader();
      
      // Explicit scan request that prompts Android Chrome permission modal
      await this.ndef.scan({ signal: this.abortController.signal });
      this.isScanning = true;

      this.ndef.addEventListener("reading", (event: any) => {
        // Prevent system default action
        try {
          if (event.preventDefault) event.preventDefault();
        } catch {}

        const serialNumber = event.serialNumber || "";
        // Clean serial number (e.g. 04:a1:b2:c3 -> 04A1B2C3)
        const cleanedUid = serialNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

        onReading({
          serialNumber: cleanedUid,
        });
      });

      this.ndef.addEventListener("readingerror", () => {
        if (onError) onError(new Error("Sinyal kartu RFID tidak terbaca jelas. Coba dekatkan lagi."));
      });

      return true;
    } catch (err: any) {
      this.isScanning = false;
      if (onError) onError(err);
      return false;
    }
  }

  stopScan() {
    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch {}
      this.abortController = null;
    }
    this.isScanning = false;
  }

  get scanning(): boolean {
    return this.isScanning;
  }
}
