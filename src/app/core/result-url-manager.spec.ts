import { TestBed } from '@angular/core/testing';
import { ResultUrlManagerService } from './result-url-manager.service';

describe('ResultUrlManagerService', () => {
  let service: ResultUrlManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ResultUrlManagerService]
    });
    service = TestBed.inject(ResultUrlManagerService);
  });

  it('should create and track object URLs', () => {
    const dummyBlob = new Blob(['dummy content'], { type: 'image/png' });
    const url = service.createUrl('item_1', dummyBlob);
    expect(url).toBeTruthy();
    expect(url).toContain('blob:');
  });

  it('should revoke object URL on revoke()', () => {
    const dummyBlob = new Blob(['dummy content'], { type: 'image/png' });
    service.createUrl('item_1', dummyBlob);
    expect(() => service.revoke('item_1')).not.toThrow();
  });

  it('should revoke all object URLs on revokeAll()', () => {
    const dummyBlob1 = new Blob(['content 1'], { type: 'image/png' });
    const dummyBlob2 = new Blob(['content 2'], { type: 'image/jpeg' });
    service.createUrl('item_1', dummyBlob1);
    service.createUrl('item_2', dummyBlob2);
    expect(() => service.revokeAll()).not.toThrow();
  });
});
