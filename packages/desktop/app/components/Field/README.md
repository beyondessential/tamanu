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

