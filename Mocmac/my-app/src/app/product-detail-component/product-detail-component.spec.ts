import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { CartService } from '../cart.service';
import { ProductsService } from '../products.service';
import { ReviewsService } from '../reviews-service';
import { ProductDetailComponent } from './product-detail-component';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: '1' })) }
        },
        {
          provide: Router,
          useValue: { navigate: () => Promise.resolve(true) }
        },
        {
          provide: ProductsService,
          useValue: { products: signal([]), catalogLoaded: signal(true) }
        },
        {
          provide: CartService,
          useValue: { notification: signal(''), add: () => undefined }
        },
        {
          provide: ReviewsService,
          useValue: { getForProduct: () => of([]) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
