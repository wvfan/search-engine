# Page Decorator

## Import
**import** page **from** '~/decorators/page';

## Usage
@page(opts)<br>
**export default** class XXX **extends** React.Component {...}

## Opts
(* means developing)
### path (string)
String. Required. Full path of page.

### parent (string)
String. Full path of parent in display tree. Can be undefined if parent is App.

### *actions (object)
Actions to change state of page's $self props (check the document of **store**)

All properties in actions should be functions. The function should return another function, with argument **state**, and the returned function can change values in **state** directly.

Actions can be accessed by props, just like redux connect.

### onSubpagesUpdate (function/object)
If it's a function, it will be transfered to:<br>
{ _def: onSubpagesUpdate }

For object, each properties should be a function with argument **params**. It will be triggered when subpages group with corresponding key changes its subpage. ('_def' for group without key).

#### params
The params is an object:
```
{
  path, // Full path of current subpage
  route, // The last section of current subpage
}
```
For page /client containing /merchants, if the current path is /client/merchants/merchant, the **params** will be:
```
{
  path: '/client/merchants',
  route: 'merchants',
}
```
In general, the **params.route** is most useful, because we want to know the tag of current subpage.

For each function, it should return an object containing the props you want to update. Then new props will be merged into $self.

### animation (object)
Animation defines the starting states and transitions of pages when it appears or disappears. The structure of it should be:
```
{
  appear: {...},
  disappear: {...},
  ...morePossibleActions,
}
```
Each property should be an object, which contains:
- Decriptions, such as **direction**
- Regular style properties

For each item, it can be a value or a function with argument **params**. If it's a function, the value of it will be set as the returned value of function.

#### params
The params is an object:
```
{
  delta, // The index's delta of current subpage and last subpage.
  deltaCycle, // Regard all subpages as a cycle and get delta.
}
```
Let's look at page /client containing /timeline, /merchants/, /settings. The indexes of three subpages will be:
- 0: /timeline
- 1: /merchants
- 2: /settings

If the path changes from /client/settings to /client/timeline, the **params** will be:
```
{
  delta: -2,
  deltaCycle: 1,
}
```

<br>
After changing all items from function to value, the object will be processed as following order:

1. Change all descriptions into regular style properties.
2. Cover the style properties which is directly defined.

#### Default Style
```
{
  left: 0,
  top: 0,
  transition: {
    left: defTime, // 200ms
    top: defTime,
    opacity: defTime,
  },
}
```

#### Descriptions
- left: { left: '-100%' }
- right: { left: '100%' }
- left-lesser: { left: '-25%' }
- right-lesser: { right: '25%' }
- top: { top: '-100%' }
- bottom: { top: '100%' }
