import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface CustomerAddress {
  _id?: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

export interface CustomerAddressesResponse {
  success: boolean;
  profile: { name: string; phone: string };
  addresses: CustomerAddress[];
}

@Injectable({ providedIn: 'root' })
export class CustomerAddressService {
  private readonly http = inject(HttpClient);

  getMyAddresses(): Observable<CustomerAddressesResponse> {
    return this.http.get<CustomerAddressesResponse>('/api/users/me/addresses');
  }

  saveMyAddresses(addresses: CustomerAddress[]): Observable<CustomerAddressesResponse> {
    return this.http.put<CustomerAddressesResponse>('/api/users/me/addresses', { addresses });
  }
}
