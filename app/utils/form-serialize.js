/* istanbul ignore file */
// get successful control from form and assemble into object
// http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2

// types which indicate a submit action and are not successful controls
// these will be ignored
const kRSubmitter = /^(?:submit|button|image|reset|file)$/i;

// node names which could be successful controls
const kRSuccessContrls = /^(?:input|select|textarea|keygen)/i;

// Matches bracket notation.
const brackets = /(\[[^\[\]]*\])/g;

function parseKeys(string) {
  const keys = [];
  const prefix = /^([^\[\]]*)/;
  const children = new RegExp(brackets);
  let match = prefix.exec(string);

  if (match[1]) {
    keys.push(match[1]);
  }

  while ((match = children.exec(string)) !== null) {
    keys.push(match[1]);
  }

  return keys;
}

function hashAssign(res, keys, value) {
  if (keys.length === 0) {
    return value;
  }

  const key = keys.shift();
  const between = key.match(/^\[(.+?)\]$/);
  let result = res;

  if (key === '[]') {
    result = res || [];

    if (Array.isArray(result)) {
      result.push(hashAssign(null, keys, value));
    } else {
      // This might be the result of bad name attributes like "[][foo]",
      // in this case the original `result` object will already be
      // assigned to an object literal. Rather than coerce the object to
      // an array, or cause an exception the attribute "_values" is
      // assigned as an array.
      const valuesKey = '_values';
      result[valuesKey] = result[valuesKey] || [];
      result[valuesKey].push(hashAssign(null, keys, value));
    }

    return result;
  }

  // Key is an attribute name and can be assigned directly.
  if (!between) {
    result[key] = hashAssign(result[key], keys, value);
  } else {
    const string = between[1];
    // +var converts the variable into a number
    // better than parseInt because it doesn't truncate away trailing
    // letters and actually fails if whole thing is not a number
    const index = +string;

    // If the characters between the brackets is not a number it is an
    // attribute name and can be assigned directly.
    if (Number.isNaN(index)) {
      result = result || {};
      result[string] = hashAssign(result[string], keys, value);
    } else {
      result = result || [];
      result[index] = hashAssign(result[index], keys, value);
    }
  }

  return result;
}

// Object/hash encoding serializer.
function hashSerializer(res, key, value) {
  const matches = key.match(brackets);
  const result = res;

  // Has brackets? Use the recursive assignment function to walk the keys,
  // construct any missing objects in the result tree and make the assignment
  // at the end of the chain.
  if (matches) {
    const keys = parseKeys(key);
    hashAssign(result, keys, value);
  } else {
    // Non bracket notation can make assignments directly.
    const existing = result[key];

    // If the value has been assigned already (for instance when a radio and
    // a checkbox have the same name attribute) convert the previous value
    // into an array before pushing into it.
    //
    // NOTE: If this requirement were removed all hash creation and
    // assignment could go through `hashAssign`.
    if (existing) {
      if (!Array.isArray(existing)) {
        result[key] = [existing];
      }
      result[key].push(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// urlform encoding serializer
function strSerialize(result, key, val) {
  // encode newlines as \r\n cause the html spec says so
  let value = val.replace(/(\r)?\n/g, '\r\n');
  value = encodeURIComponent(value);

  // spaces should be '+' rather than '%20'.
  value = value.replace(/%20/g, '+');
  return `${result}${(result ? '&' : '')}${encodeURIComponent(key)}=${value}`;
}

// serializes form fields
// @param form MUST be an HTMLForm element
// @param options is an optional argument to configure the serialization. Default output
// with no options specified is a url encoded string
//  - hash: [true | false] Configure the output type. If true, the output will
//  be a js object.
//  - serializer: [function] Optional serializer function to override the default one.
//  The function takes 3 arguments (result, key, value) and should return new result
//  hash and url encoded str serializers are provided with this module
//  - disabled: [true | false]. If true serialize disabled fields.
//  - empty: [true | false]. If true serialize empty fields
function serialize(form, opt) {
  let options = opt;
  if (typeof options !== 'object') {
    options = { hash: !!opt };
  } else if (options.hash === undefined) {
    options.hash = true;
  }

  let result = (options.hash) ? {} : '';
  const serializer = options.serializer || ((options.hash) ? hashSerializer : strSerialize);

  const elements = form && form.elements ? form.elements : [];

  // Object store each radio and set if it's empty or not
  const radioStore = Object.create(null);

  for (let i = 0; i < elements.length; ++i) {
    const element = elements[i];

    // ingore disabled fields
    if ((!options.disabled && element.disabled) || !element.name) {
      continue;
    }
    // ignore anyhting that is not considered a success field
    if (!kRSuccessContrls.test(element.nodeName) ||
      kRSubmitter.test(element.type)) {
      continue;
    }

    const key = element.name;
    let { value } = element;
    if (key === 'confirmpassword') {
      continue;
    }
    // we can't just use element.value for checkboxes cause some browsers lie to us
    // they say "on" for value when the box isn't checked
    if ((element.type === 'checkbox' || element.type === 'radio') && !element.checked) {
      value = undefined;
    }

    // If we want empty elements
    if (options.empty) {
      // for checkbox
      if (element.type === 'checkbox' && !element.checked) {
        value = '';
      }

      // for radio
      if (element.type === 'radio') {
        if (!radioStore[element.name] && !element.checked) {
          radioStore[element.name] = false;
        } else if (element.checked) {
          radioStore[element.name] = true;
        }
      }

      // if options empty is true, continue only if its radio
      if (value === undefined && element.type === 'radio') {
        continue;
      }
    } else if (!value) {
      // value-less fields are ignored unless options.empty is true
      continue;
    }

    // multi select boxes
    if (element.type === 'select-multiple') {
      value = [];

      const selectOptions = element.options;
      let isSelectedOptions = false;
      for (let j = 0; j < selectOptions.length; ++j) {
        const option = selectOptions[j];
        const allowedEmpty = options.empty && !option.value;
        const hasValue = (option.value || allowedEmpty);
        if (option.selected && hasValue) {
          isSelectedOptions = true;

          // If using a hash serializer be sure to add the
          // correct notation for an array in the multi-select
          // context. Here the name attribute on the select element
          // might be missing the trailing bracket pair. Both names
          // "foo" and "foo[]" should be arrays.
          if (options.hash && key.slice(key.length - 2) !== '[]') {
            result = serializer(result, `${key}[]`, option.value);
          } else {
            result = serializer(result, key, option.value);
          }
        }
      }

      // Serialize if no selected options and options.empty is true
      if (!isSelectedOptions && options.empty) {
        result = serializer(result, key, '');
      }

      continue;
    }

    result = serializer(result, key, value);
  }

  // Check for all empty radio buttons and serialize them with key=""
  if (options.empty) {
    Object.keys(radioStore).forEach((key) => {
      if (!radioStore[key]) {
        result = serializer(result, key, '');
      }
    });
  }

  return result;
}

export default {
  serialize,
};
