import {Component, ElementRef, ViewChild} from '@angular/core';
import * as JSJoda from 'js-joda';
import {LocalDate} from 'js-joda';
import {nativeJs} from "js-joda";
import {DateTimeFormatter} from "js-joda";
import {AbstractEditorComponent} from "./abstract-editor-component";

/**
 * A Date Editor Component for AgGrid, returns a LocalDate object (see https://js-joda.github.io/js-joda/manual/LocalDate.html)
 */
@Component({
  styles: [`
      input {
          width: 100%;
          height: 100%;
      }
  `],
  template: `<input #input (keydown)="onKeyDown($event)" [(ngModel)]="value" placeholder="MM/DD/YYYY">`
})
export class LocalDateCellEditorComponent extends AbstractEditorComponent<LocalDate> {
  @ViewChild('input', { static: true }) public input: ElementRef;

  // characters allowed to be in the value
  allowedChars = '1234567890/';

  // characters allowed to start an edit
  startEditChars = '1234567890';

  private minValue: LocalDate;
  private maxValue: LocalDate;

  constructor() {
    super()
  }

  agInit(params: any): void {
    if (this.isDefined(params['minValue'])) {
      this.minValue = this.stringToTypedValue(params['minValue']);
    }

    if (this.isDefined(params['maxValue'])) {
      this.maxValue = this.stringToTypedValue(params['maxValue']);
    }

    super.agInit(params);

    if (this.value) {
      this.value = this.formatLocalDate(this.value as LocalDate);
    }
  }

  toLocalDate = (value: string | Date | LocalDate | undefined): LocalDate => {
    if (value instanceof LocalDate) {
      return value;
    }

    if (value instanceof Date && !isNaN(value.getTime())) {
      return LocalDate.from(nativeJs(value));
    }

    if (typeof value === 'string') {
      if ((value && value.trim())) {
        try {
          return LocalDate.parse(value.trim(), DateTimeFormatter.ofPattern('M/d/yyyy'));
        } catch (exception) {
          return undefined;
        }
      }

      return undefined;
    }

    return undefined;
  };

  stringToTypedValue(stringValue): JSJoda.LocalDate {
    const localDateValue = this.toLocalDate(stringValue);
    if (localDateValue && this.minValue && localDateValue.isBefore(this.minValue)) {
      return undefined;
    }

    if (localDateValue && this.maxValue && localDateValue.isAfter(this.maxValue)) {
      return undefined;
    }

    return localDateValue;
  }

  formatLocalDate = (localDate: LocalDate) => {
    if (localDate instanceof LocalDate) {
      return localDate.format(DateTimeFormatter.ofPattern('MM/dd/yyyy'));
    }
    return localDate;
  };
}
