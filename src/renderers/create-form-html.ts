import { EditDatumFormCreator, NewRelFormCreator, SelectField } from '../types/form'
import * as icons from './icons'


export function getHtmlNew(form_creator: NewRelFormCreator) {
  return (` 
    <form id="familyForm" class="f3-form">
      ${closeBtn()}
      <h3 class="f3-form-title">${form_creator.title}</h3>
      ${genderRadio(form_creator)}

      ${fields(form_creator)}
      
      <div class="f3-form-buttons">
        <button type="button" class="f3-cancel-btn">Cancel</button>
        <button type="submit">Submit</button>
      </div>

      ${form_creator.linkExistingRelative ? addLinkExistingRelative(form_creator) : ''}
    </form>
  `)
}

export function getHtmlEdit(form_creator: EditDatumFormCreator) {
  return (` 
    <form id="familyForm" class="f3-form ${form_creator.editable ? '' : 'non-editable'}">
      ${closeBtn()}
      <div style="text-align: right; display: 'block'">
        ${!form_creator.no_edit ? addRelativeBtn(form_creator) : ''}
        ${form_creator.no_edit ? spaceDiv() : editBtn(form_creator)}
      </div>

      ${genderRadio(form_creator)}

      ${fields(form_creator)}
      
      <div class="f3-form-buttons">
        <button type="button" class="f3-cancel-btn">Cancel</button>
        <button type="submit">Submit</button>
      </div>

      ${form_creator.linkExistingRelative ? addLinkExistingRelative(form_creator) : ''}

      <hr>
      ${deleteBtn(form_creator)}

      ${removeRelativeBtn(form_creator)}
    </form>
  `)

  
}

function deleteBtn(form_creator: EditDatumFormCreator) {
  return (`
    <div>
      <button type="button" class="f3-delete-btn" ${form_creator.can_delete ? '' : 'disabled'}>
        Delete
      </button>
    </div>
  `)
}

function removeRelativeBtn(form_creator: EditDatumFormCreator) {
  return (`
    <div>
      <button type="button" class="f3-remove-relative-btn${form_creator.removeRelativeActive ? ' active' : ''}">
        ${form_creator.removeRelativeActive ? 'Cancel Remove Relation' : 'Remove Relation'}
      </button>
    </div>
  `)
}

function addRelativeBtn(form_creator: EditDatumFormCreator) {
  return (`
    <span class="f3-add-relative-btn">
      ${form_creator.addRelativeActive ? icons.userPlusCloseSvgIcon() : icons.userPlusSvgIcon()}
    </span>
  `)
}

function editBtn(form_creator: EditDatumFormCreator) {
  return (`
    <span class="f3-edit-btn">
      ${form_creator.editable ? icons.pencilOffSvgIcon() : icons.pencilSvgIcon()}
    </span>
  `)
}

function genderRadio(form_creator: EditDatumFormCreator | NewRelFormCreator) {
  if (!form_creator.editable) return ''
  return (`
    <div class="f3-radio-group">
      ${form_creator.gender_field.options.map(option => (`
        <label>
          <input type="radio" name="${form_creator.gender_field.id}" 
            value="${option.value}" 
            ${option.value === form_creator.gender_field.initial_value ? 'checked' : ''}
            ${form_creator.gender_field.disabled ? 'disabled' : ''}
          >
          ${option.label}
        </label>
      `)).join('')}
    </div>
  `)
}

// Native HTML input types the default form renderer knows how to draw.
// Any unrecognised type falls back to a plain text input.
const NATIVE_INPUT_TYPES = ['text', 'date', 'month', 'number', 'tel', 'email', 'url', 'password', 'color']

function fields(form_creator: EditDatumFormCreator | NewRelFormCreator) {
  if (!form_creator.editable) return infoField()
  let fields_html = ''
  form_creator.fields.forEach(field => {
    if (field.type === 'textarea') {
      fields_html += `
      <div class="f3-form-field">
        <label>${esc(field.label)}</label>
        <textarea name="${esc(field.id)}"
          placeholder="${esc(field.placeholder || field.label)}">${esc(field.initial_value || '')}</textarea>
      </div>`
    } else if (field.type === 'select') {
      const select_field = field as SelectField
      fields_html += `
      <div class="f3-form-field">
        <label>${esc(select_field.label)}</label>
        <select name="${esc(select_field.id)}">
          <option value="">${esc(select_field.placeholder || `Select ${select_field.label}`)}</option>
          ${select_field.options.map((option) => `<option ${option.value === select_field.initial_value ? 'selected' : ''} value="${esc(option.value)}">${esc(option.label)}</option>`).join('')}
        </select>
      </div>`
    } else if (field.type === 'rel_reference') {
      fields_html += `
      <div class="f3-form-field">
        <label>${esc(field.label)} - <i>${esc(field.rel_label)}</i></label>
        <input type="${getInputType(field.input_type)}"
          name="${esc(field.id)}"
          value="${esc(field.initial_value || '')}"
          placeholder="${esc(field.label)}">
      </div>`
    } else {
      fields_html += `
      <div class="f3-form-field">
        <label>${esc(field.label)}</label>
        <input type="${getInputType(field.type)}"
          name="${esc(field.id)}"
          value="${esc(field.initial_value || '')}"
          placeholder="${esc(field.placeholder || field.label)}">
      </div>`
    }
  })
  return fields_html

  function infoField() {
    let fields_html = ''
    form_creator.fields.forEach(field => {
      if (field.type === 'rel_reference') {
        if (!field.initial_value) return
        fields_html += `
        <div class="f3-info-field">
          <span class="f3-info-field-label">${esc(field.label)} - <i>${esc(field.rel_label)}</i></span>
          <span class="f3-info-field-value">${infoValue(field.input_type, field.initial_value)}</span>
        </div>`
      } else if (field.type === 'select') {
        const select_field = field as SelectField
        if (!field.initial_value) return
        fields_html += `
        <div class="f3-info-field">
          <span class="f3-info-field-label">${esc(select_field.label)}</span>
          <span class="f3-info-field-value">${esc(select_field.options.find(option => option.value === select_field.initial_value)?.label || '')}</span>
        </div>`
      } else {
        fields_html += `
        <div class="f3-info-field">
          <span class="f3-info-field-label">${esc(field.label)}</span>
          <span class="f3-info-field-value">${infoValue(field.type, field.initial_value)}</span>
        </div>`
      }
    })
    return fields_html
  }
}

// Returns a safe input type attribute, defaulting to 'text' for unknown types.
function getInputType(type: string | undefined) {
  return type && NATIVE_INPUT_TYPES.includes(type) ? type : 'text'
}

// Renders a read-only field value, turning url/email/tel fields into clickable links.
function infoValue(type: string | undefined, value: any) {
  if (value === undefined || value === null || value === '') return ''
  const str = String(value)
  if (type === 'url') {
    const href = /^(https?:)?\/\//i.test(str) || str.startsWith('mailto:') ? str : `https://${str}`
    return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(str)}</a>`
  } else if (type === 'email') {
    return `<a href="mailto:${esc(str)}">${esc(str)}</a>`
  } else if (type === 'tel') {
    return `<a href="tel:${esc(str)}">${esc(str)}</a>`
  }
  return esc(str)
}

// Escapes a value for safe interpolation into HTML text content or attribute values.
function esc(str: any) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function addLinkExistingRelative(form_creator: EditDatumFormCreator | NewRelFormCreator) {
  const title = form_creator.linkExistingRelative.hasOwnProperty('title') ? form_creator.linkExistingRelative.title : 'Profile already exists?'
  const select_placeholder = form_creator.linkExistingRelative.hasOwnProperty('select_placeholder') ? form_creator.linkExistingRelative.select_placeholder : 'Select profile'
  const options = form_creator.linkExistingRelative.options as SelectField['options']
  return (`
    <div>
      <hr>
      <div class="f3-link-existing-relative">
        <label>${esc(title)}</label>
        <select>
          <option value="">${esc(select_placeholder)}</option>
          ${options.map(option => `<option value="${esc(option.value)}">${esc(option.label)}</option>`).join('')}
        </select>
      </div>
    </div>
  `)
}


function closeBtn() {
  return (`
    <span class="f3-close-btn">
      ×
    </span>
  `)
}

function spaceDiv() {
  return `<div style="height: 24px;"></div>`
}
