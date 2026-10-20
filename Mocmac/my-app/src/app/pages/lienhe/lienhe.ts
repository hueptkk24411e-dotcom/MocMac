import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-lienhe',
  standalone: false,
  styleUrl: './lienhe.css',
  templateUrl: './lienhe.html',
})
export class Lienhe {

  contact = {
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  };

  submitted = false;
  isLoading = false;

  constructor(private http: HttpClient) {}

  sendContact(): void {
    this.isLoading = true;
    this.submitted = false;

    console.log('Dữ liệu liên hệ:', this.contact);
    this.http
      .post('/api/contacts', this.contact, {
        observe: 'response'
      })
      .subscribe({

        next: (response) => {
          console.log('Status:', response.status);
          console.log('Phản hồi từ server:', response.body);

          if (response.status === 200 || response.status === 201) {

            alert('Gửi liên hệ thành công!');

            this.submitted = true;

            // Xóa dữ liệu form sau khi gửi thành công
            this.contact = {
              name: '',
              phone: '',
              email: '',
              subject: '',
              message: ''
            };
          }

          this.isLoading = false;
        },

        error: (error) => {
          console.error('Lỗi gửi liên hệ:', error);

          this.isLoading = false;

          alert(
            error.error?.message ||
            'Không thể gửi liên hệ. Vui lòng thử lại.'
          );
        }

      });
  }
}