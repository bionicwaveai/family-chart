import { Datum } from "./data"
import { Store } from "./store"

import { AddRelative } from "../core/add-relative"
import { RemoveRelative } from "../core/remove-relative"
import { EditTree } from "../core/edit"


export interface FormCreatorSetupProps {
  datum: Datum
  store: Store
  fields: any[]  // todo: Field[]
  postSubmitHandler: (props: any) => void
  onCancel: () => void
  editFirst: boolean
  no_edit: boolean
  link_existing_rel_config?: {linkRelLabel: (d: Datum) => string, title?: string, select_placeholder?: string}
  onFormCreation: EditTree['onFormCreation']
  addRelative?: AddRelative
  removeRelative?: RemoveRelative
  deletePerson?: () => void
  onSubmit?: (e: Event, datum: Datum, applyChanges: () => void, postSubmit: () => void) => void
  onDelete?: (datum: Datum, deletePerson: () => void, postSubmit: (props: any) => void) => void
  canEdit?: (datum: Datum) => boolean
  canDelete?: (datum: Datum) => boolean
}

export interface BaseFormCreator {
  datum_id: string;
  fields: any[];
  onSubmit: (e: any) => void;
  onCancel: () => void;
  onFormCreation: FormCreatorSetupProps['onFormCreation']
  no_edit: boolean;
  gender_field: {
    id: 'gender';
    type: 'switch';
    label: 'Gender';
    initial_value: 'M' | 'F';
    disabled: boolean;
    options: {value: 'M' | 'F'; label: string}[];
  };
  linkExistingRelative?: any;
}

export interface EditDatumFormCreator extends BaseFormCreator {
  onDelete: () => void;
  addRelative: () => void;
  addRelativeCancel: () => void;
  addRelativeActive: boolean;
  removeRelative: () => void;
  removeRelativeCancel: () => void;
  removeRelativeActive: boolean;
  editable: boolean;
  can_delete: boolean;
}

export interface NewRelFormCreator extends BaseFormCreator {
  title: string;
  new_rel: boolean;
  editable: boolean;
}

export type FormCreator = EditDatumFormCreator | NewRelFormCreator;

/**
 * Native input types supported by the default form renderer.
 * Any of these can be used as a field `type` in `EditTree.setFields`,
 * e.g. `{type: 'date', id: 'birth date', label: 'Birth Date'}`.
 */
export type NativeInputType =
  | 'text'
  | 'date'
  | 'month'
  | 'number'
  | 'tel'
  | 'email'
  | 'url'
  | 'password'
  | 'color'

export interface Field {
  id: string;
  type: string;
  label: string;
  initial_value: string;
  placeholder?: string;
}

export interface RelReferenceField extends Field {
  type: 'rel_reference';
  rel_id: string;
  rel_label: string;
  rel_type: 'spouse';
  input_type?: NativeInputType;
}

export interface RelReferenceFieldCreator {
  rel_type: 'spouse';
  id: string;
  label: string;
  getRelLabel: (datum: Datum) => string;
  /** Native input type used for the rel-reference value (defaults to 'text'). Useful for e.g. marriage/divorce dates. */
  input_type?: NativeInputType;
}

export interface SelectField extends Field {
  type: 'select';
  options: {value: string; label: string}[];
}

export interface SelectFieldCreator {
  id: string;
  type: 'select';
  label: string;
  placeholder?: string;
  options?: {value: string; label: string}[];
  optionCreator?: (datum: Datum) => {value: string; label: string}[];
}
