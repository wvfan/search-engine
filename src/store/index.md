# Store

## Mobx
For this version we use Mobx as state manager. The documents of Mobx can be found on internet. For convenient, here are some **concepts** of it.

### Observable
An observable variable is a variable whose **changing** will be **observed**. It's very simple to change it, just assign a new value to it. However, a variable is observable only if it exists at the first time.

A non-observable example:
```
class Store {
  @observable todos

  constructor() {
    this.todos = {
      todo1: 'Assignment1',
      todo2: 'Assignment2',
    };
  }
}
const store = new Store();

autorun(() => {
  console.log(store.todos.todo3);
});
store.todos.todo3 = 'Assignment3';
```
The result of this code is only 'null'.

#### Autorun

The autorun is amazing. The callback will run when it's defined. Then, if any observable variables it used at the first time **change**, it will run again. That is why only existing variable can be observed: it should be used when autorun defined.

#### Dynamic Object

Sometimes we want to add a property to an object, and want to observe this object. At this case we have to use observable.map(obj). The useage of it is the same as native Map, we need to use .get() and .set() to read and write, which is not so convenient. So we should try to hide it in the basic layer, and use mobx.toJS(map) to change map to simple object, then pass it to view.

#### With React

We will module **mobx-react** to connect mobx and react. It's packaged in **page** decorator, so we don't need to use it directly when we write pages. The **observer** decorator in **mobx-react** will make **render** function of a react component autorun. So if any variables that used by **render** function change, the component will rerender.

In most cases you don't need to handle this, see the document of **page** decorator to know why.

### Computed

A computed function is like autorun, but it will return a value, which is related to some observable variables. If a computed function is observed by autorun function, when the observable variables used change, it will run again, and also trigger the autorun function. It will be used in store **data actions.catch**. You can check the document of store/data for more information.

### Transaction

All changes of observable variables in the same transaction will be cached, and won't trigger any autorun or computed function immediatly. When the transaction function finished, all changes will be effective together. This is useful for actions. Because in an action, we may need to change may variables, but we only need it to be triggered once.

In fact, mobx has it's own action, but it's not convenient for us to use it directly, so I use the transaction, which is in lower layer.
