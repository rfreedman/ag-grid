import {AfterViewInit, ElementRef} from '@angular/core';
import {AgEditorComponent} from 'ag-grid-angular/main';
import {GridApi} from 'ag-grid-community';

/** 
 * Convenience base class for input field based AgGrid Cell Editors 
 */
export abstract class AbstractEditorComponent<T> implements AgEditorComponent, AfterViewInit {
  // the input element - should be a @ViewChild in the subclass
  public abstract input: ElementRef;

  // characters allowed to be in the value
  abstract allowedChars: string;

  // characters allowed to start an edit (should be allowedChars or a subset of allowedChars)
  abstract startEditChars: string;

  // converts the string value from the input into an instance of the required type
  abstract stringToTypedValue(stringValue: string): T;


  public value: T | string | undefined;

  private cancelBeforeStart = false;

  // keys which nav in the grid (ending the edit)
  private gridNavigationKeys = ['Tab', 'Enter'];

  // keys that would normally navigate in the grid,
  // but which we want to use to navigate in the input field
  private fieldNavigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  // keys that modify the input, but don't need to be checked for validity
  private specialModifierKeys = ['Backspace', 'Delete', 'Escape'];

  private gridApi: GridApi;
  private colKey: string;
  private rowNodeId: string;

  protected initialValue = undefined as T;

  private initialConvertedValue;
  private editStartedByTyping = false;

  isDefined = (value) => {
    return value !== undefined && value !== null;
  };

  getValue(): any {
    return this.stringToTypedValue(this.value);
  }

  agInit(params: any): void {
    this.gridApi = params.api;
    this.colKey = params.column.colId;
    this.rowNodeId = params.node.id;

    this.initialValue = params.value;
    this.initialConvertedValue = this.stringToTypedValue(params.value);

    this.handleInitialKeyPress(params);
  }

  private handleInitialKeyPress(params: any) {
    this.value = params.value;

    if (params.charPress) {
      // the user attempted to start an edit by pressing a key (other than the 'enter/return' key)
      const allowedEditStartKey = this.startEditChars.indexOf(params.charPress) >= 0;

      if (allowedEditStartKey) {
        this.editStartedByTyping = true;
        this.cancelBeforeStart = false;
        this.value = params.charPress;
      } else {
        this.cancelBeforeStart = true;
      }
    }
  }

  private isGridNavigationKey(event: KeyboardEvent): boolean {
    return this.gridNavigationKeys.indexOf(event.key) !== -1;
  }

  private isFieldNavigationKey(event: KeyboardEvent): boolean {
    return this.fieldNavigationKeys.indexOf(event.key) !== -1;
  }

  private isSpecialModifierKey(event: KeyboardEvent): boolean {
    return this.specialModifierKeys.indexOf(event.key) !== -1;
  }

  private isAllowedChar(event: KeyboardEvent): boolean {
    return this.allowedChars.indexOf(event.key) !== -1;
  }

  onKeyDown(event): void {
    if (this.isGridNavigationKey(event)) {
      // allow the grid navigation
      return;
    }

    if (this.isFieldNavigationKey(event)) {
      // allow the field navigation,
      // but stop it's propagation to the grid
      event.stopPropagation();
      return;
    }

    if (this.isSpecialModifierKey(event)) {
      // allow the 'special' key,
      // which potentially modifies the value,
      // but which doesn't introduce new characters,
      // and so doesn't require validation (e.g. delete, backspace)
      return;
    }

    // if the key is not allowed, reject the keypress
    if (!this.isAllowedChar(event)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // the keypress is accepted
  }

  ngAfterViewInit(): void {
    // set focus to the input
    setTimeout(() => {
      this.input.nativeElement.focus();
      if (!this.editStartedByTyping) {
        this.input.nativeElement.select();
      }
    });
  }

  isCancelBeforeStart(): boolean {
    return this.cancelBeforeStart;
  }

  isCancelAfterEnd(): boolean {
    const currentValue = this.getValue();

    return (!this.isDefined(currentValue) && !this.isDefined(this.initialConvertedValue))
      || (this.isDefined(currentValue) && this.isDefined(this.initialConvertedValue) 
      && currentValue.toString() === this.initialConvertedValue.toString());
  }

}
