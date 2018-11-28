# Input and Field components

Each control provides two exports, Field and Input. Both variants come fully
styled. 

They accept a common set of props:

- `label` (string): text to show as placeholder or beside the control
- `helperText` (string): longer text when more explanation is required
- `required` (bool): indicates whether a field is mandatory

The design goal of this submodule is that any component should handle displaying
these props 
They don't provide any layout functionality -- this should be handled by the 
containing component. Most are just thin wrappers around their Material-UI
counterparts.

## Field (eg DateField, TextField)

This is the dynamic version of the field, written to be hooked up to Formik.

```javascript
<Field
  name="firstName"
  component={ TextField }
/>
```

When placed within a Formik form, this will automatically bind everything to
the form object.

## Input (eg DateInput, TextInput)

This is the plain version of the field. It comes with all the appropriate 
formatting, but is not bound to any data source. It can be used unbound or can
be given `value` and `onChange` props directly.

```
<TextField 
  value={state.firstName}
  onChange={(e) => this.setState({ firstName: e.target.value }) }
/>
```

This is obviously more verbose, but can be used in situations where Formik is
inappropriate (for example, in a nested field, or when there's only one control).

## AutoField and MultiAutoField

These are fields designed for generating a form from a schema. 

A single field can be generated from part of a schema. Based on the `type` 
property of the definition, AutoField will render the appropriate component
with the right label, displays, events, etc -- a checkbox for a boolean field,
a calendar selector for a date, a text field for a string, etc.

```javascript
const definition = {
  label: 'First name',
  name: 'firstName',
  required: true,
  type: 'string',
};

...

<AutoField definition={ definition } />
```

MultiAutoField behaves similarly, except it renders an array of fields.
Because schemas are usually in key/value objects that do not preserve key order,
MultiAutoField takes another parameter indicating which fields to render and
which order to render them in.

MultiAutoField currently just renders an array, so it's not expected that you
render an entire schema with a single MultiAutoField component - there's almost 
no way it'd come out laid out nicely. It's just meant to make groups of fields 
easier, especially in cases when you already have a schema handy.

```javascript
const definitions = {
  name: {
    label: "First name",
    name: "firstName",
    required: true,
    type: "string",
    // note that additional props will be passed down to the rendered component
    helperText: 'Please use the full legal name of the patient here',
  },
  bloodType: {
    label: "Blood type",
    name: "bloodType",
    type: "string",
    options: bloodTypeOptions, // imported from elsewhere
  },
  dateOfBirth: {
    label: "Date of birth",
    name: "dateOfBirth",
    type: "date",
  },
  ... etc etc
};

...

return (
  <div>
    <h2>Patient details</h2>
    <MultiAutoField 
      definitions={definitions}
      fields={['firstName', 'middleName', 'lastName']} 
    />
    <h2>Contact information</h2>
    <MultiAutoField 
      definitions={definitions}
      fields={['phone', 'email', 'address']} 
    />
  </div>
);
```


