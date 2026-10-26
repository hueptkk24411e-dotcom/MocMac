import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import * as i0 from "@angular/core";
import * as i1 from "@angular/router";
export class PageComponent {
    route = inject(ActivatedRoute);
    data = toSignal(this.route.data);
    static ɵfac = function PageComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || PageComponent)(); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: PageComponent, selectors: [["app-page-component"]], standalone: false, decls: 7, vars: 1, consts: [[1, "wrap", "page"], ["routerLink", "/", 1, "btn"]], template: function PageComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "section", 0)(1, "h1");
            i0.ɵɵtext(2);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(3, "p");
            i0.ɵɵtext(4, "Trang \u0111ang \u0111\u01B0\u1EE3c x\u00E2y d\u1EF1ng.");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(5, "a", 1);
            i0.ɵɵtext(6, "V\u1EC1 trang ch\u1EE7");
            i0.ɵɵelementEnd()();
        } if (rf & 2) {
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate(ctx.data()?.["title"]);
        } }, dependencies: [i1.RouterLink], styles: [".page[_ngcontent-%COMP%]{padding-top:60px;padding-bottom:100px;min-height:50vh}\r\nh1[_ngcontent-%COMP%]{color:var(--%NS%moss);font-size:36px;margin:0 0 8px}\r\np[_ngcontent-%COMP%]{color:var(--%NS%ink2);margin:0 0 20px}"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(PageComponent, [{
        type: Component,
        args: [{ selector: 'app-page-component', standalone: false, template: "<section class=\"wrap page\">\r\n  <h1>{{ data()?.['title'] }}</h1>\r\n  <p>Trang \u0111ang \u0111\u01B0\u1EE3c x\u00E2y d\u1EF1ng.</p>\r\n  <a class=\"btn\" routerLink=\"/\">V\u1EC1 trang ch\u1EE7</a>\r\n</section>\r\n", styles: [".page{padding-top:60px;padding-bottom:100px;min-height:50vh}\r\nh1{color:var(--moss);font-size:36px;margin:0 0 8px}\r\np{color:var(--ink2);margin:0 0 20px}\r\n"] }]
    }], null, null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(PageComponent, { className: "PageComponent", filePath: "src/app/pages/page-component/page-component.ts", lineNumber: 11 }); })();
