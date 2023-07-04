# Field Architecture

Tamanu is an app that is _mostly_ forms, so the architecture of the forms system is
really important. We have a few design goals here:

- creating a form must be simple and involve minimal boilerplate
  - automated state management (no writing `value` and `onChange` for each field)
  - form submission handled by one `onSubmit(formData)` callback
  - initial form values as one single object passed to the form
  - straightforward validation
- altering a form must be simple and intuitive
  - swapping out controls (for eg exchanging a TextField for a DateField) should be a 1-line change
  - moving components around within the heirarchy should not affect how the form behaves
  - input components should be able to be nested (for eg in a `div`) without issues

## Forms

`Formik` takes us most of the way to these goals, handling state, validation and error management
pretty nicely. The exports `Field` and `formikConnect` are particularly useful.

```javascript
const animalTypeOptions = [
  { value: "mammal", label: "Mammal" },
  { value: "insect", label: "Insect" },
  { value: "bird", label: "Bird" },
  { value: "fish", label: "Fish" },
  { value: "other", label: "Other" },
];

export const AnimalForm = (

  const renderForm = ({ onSubmit }) => (
    <FormGrid>
      <Field
        name="name"
        component={TextField}
      />
      <Field
        name="animalType"
        component={SelectField}
        options={animalTypeOptions}
      />
      <FormGrid>
        <Field
          name="legCount"
          component={NumberField}
        />
        <Field
          name="wingCount"
          component={NumberField}
        />
      </FormGrid>
      <Button onClick={onSubmit}>Submit</Button>
    </FormGrid>
  );

  return (
    <Form
      renderForm={renderForm}
      onSubmit={async data => {
        // send data to an api and wait for a response
      }}
      validate={data => {
        // set errors on the form state if any are encountered
      }}
      initialValues={{
        name: "Horse",
        animalType: "mammal",
        legs: 4,
      }}
    />
  );
);
```

### Options

There are several components that involve selecting things from a list. Autocompletes, select 
fields, radio buttons, etc. For consistency, these all adhere to this standard:

```javascript
const options = [
  { value: 'machine-value', label: 'Formatted value shown to user' },
  { value: 'machine-value-2', label: 'Second value shown to user' },
];
```

That is: an array of objects, with each object having a `value` and `label` member. It's fine to
include other members in there if your control does some additional formatting, but keeping to
this fundamental structure lets us maintain the most flexibility.

## Input and Field components

Each control provides two exports, `___Field` and `___Input`. Both variants come fully
styled. 

They accept a common set of props:

- `label` (string): text to show as placeholder or beside the control
- `helperText` (string): longer text when more explanation is required
- `required` (bool): indicates whether a field is mandatory

The design goal of this submodule is that any component should handle displaying these
props correctly, so that one input component can be swapped out for another one without
having to make any other edits.

They don't provide any layout functionality -- this should be handled by the 
containing component. Most are just thin wrappers around their Material-UI
counterparts.

### ComponentInput (eg DateInput, TextInput)

This is the plain version of the field. It comes with all the appropriate 
formatting, but is not bound to any data source. It can be used unbound or can
be given `value` and `onChange` props directly.

```javascript
<TextField 
  value={state.firstName}
  onChange={(e) => this.setState({ firstName: e.target.value }) }
/>
```

This can be used in situations where Formik is inappropriate (for example, in 
a nested field, or when there's only one control).

Note that the `onChange` method expects an event object, not a raw value. This is
just because a lot of handlers expect things in that format. For a custom control,
it's safe to create a dummy event value; the only requred attributes on `e.target`
for successful Formik interaction are `name` and `value`.

```javascript
export const MyCustomField = ({ name, value, onChange }) => (
  <div>
    <div>Current value: <span>{value}</span></div>
    <div>
      <button 
        onClick={() => onChange({
          target: {
            name,
            value: 10,
          }
        })}
      >Set value to 10</button>
  </div>
);
```

### ComponentField (eg DateField, TextField)

This is the dynamic version of the field, written to be hooked up to Formik. This is 
the component that will be used the most often, as most input controls throughout
the app are part of a larger form.

A ComponentField is just a wrapper around a ComponentInput. They shouldn't have any
other differences.

```javascript
// definition
export const TextField = ({ field, ...props }) => (
  <TextInput name={field.name} value={field.value || ''} onChange={field.onChange} {...props} />
);

// usage
<Field
  name="firstName"
  component={ TextField }
/>
```

When placed within a Formik form, this will automatically bind everything to
the form object.

