import { Injectable } from '@angular/core';
import { PlayIntegrity } from '@capacitor-community/play-integrity';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PlayIntegrityService {

  constructor(private http: HttpClient) {}

  async verifyDevice(): Promise<boolean> {
    try {

      const result = await PlayIntegrity.requestIntegrityToken({
        nonce: btoa(Date.now().toString()),
        googleCloudProjectNumber: 0
      });

      const token = result.token;

      // Send to backend
      const response: any = await this.http
        .post('https://yourapi.com/api/verify-integrity', { token })
        .toPromise();

      return response?.isTrusted === true;

    } catch (error) {
      console.error('[Integrity Error]', error);
      return false;
    }
  }
}