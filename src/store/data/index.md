# Data

The **data** store is a manager of data from database. We should avoid using firestore API directly, but use the actions of data as a middle layer.

The principle of whole structure will be introduced first. If you want to know how to write code, jump to the **fetch data - schema** and **actions** parts.

## Fetch Data

The whole structure can be descripted as the following figure:
![Image of Yaktocat](https://firebasestorage.googleapis.com/v0/b/foopar-firebase.appspot.com/o/documents%2F3.png?alt=media&token=4b2136ed-8747-4d61-8741-7dc707b7b85d)

### View
View means the entities that display data from database. The tool that view describe what kind of data it wants is **schema**. It will be introduce at the end of **Fetch Data**. View can only request data by passing a schema to data store through actions, then use promise or callback to get all data it need.

There are two types of request: **listen** and **catch**.

#### Listen
Listen means the view need to fetch new data from database(firestore), which is not existing in data store now. It usually used by containers. So a container should handle all data fetching for its components. Because we need to get data through the internet, all listen request will be handled in **asynchronous**.

#### Catch
Catch means the view only need existing data in data store, and won't request for new data. It usually used by components. So a component should not request for data, just use the data fetched by its container. Because all data has been fetched to data store, all catch request will be handled in **synchronous**.

### Data Store

The processed data will be stored in data store. It will directly proceed the **catch** request, and pass processed schema to cache layer for **listen** request. For **listen** request, the data of a whole schema will be updated at the same time, which will reduce the rerender times of view.

The data store will also be used as an offline cache. If the device is offline, when it get **listen** request, it will regard it as **catch** request, and get data from store directly.

### Cache

The cache layer will directly fetch data from firestore. It will cache data of schema. Besides, it's based on document(the concept of firestore), so it will prevent coincident request, but handle the callbacks seperately.

### Schema

The form of a schema is an object. There are two types of properties: **functional** property has key starts with $, **data** property has key without $. There are also two types of node: **container** node only has **data** properties, **listener** node has **functional** properties.

#### Listener Node

A listener node will be translated to a query, and fetch data from firestore. It can be divided into two types:
- Document nodes, which must only have **$id** property
- Query nodes, which must NOT have **$id**, but have **$where**, **$orderBy** or **$forEach** property.

##### $coll
For all nodes, there is a **$coll** property, which specify the collection of current node. But it can be left, because it can be filled according to key of node and *schema in database*.
```
{
  merchant: {
    $id: '2lkjsodifjoi',
  },
} // Valid, $coll = 'merchants'
```
```
{
  merchants: {
    $where: {
      availability: true,
    },
  },
} // Valid, $coll = 'merchants'
```
```
{
  merchants: {
    $id: '2lkjlskdjfio',
  },
} // Invalid, no collection named 'merchantss'
```
(Be careful of the suffix 's')

##### $id
$id specify the id of document.

We always store id of sub-items in database. However, in view layer we need detailed data of sub-items. Then we can add some **data** property in node. All **data** property in **document** node should be a function: data => sub-schema. The data means sub-item's data, the sub-schema is for fetching sub-item.
```
{
  merchant: {
    $id: 'sldkj2o3ifjs',
    location: locationId => ({
      $id: locationId,
    }), // Valid, $coll will be 'locations'
  },
}
```
The location of this merchant will has detailed data.

##### $where
$where is the filter of query. It has two types of property:
- value(number, string)
- array of length 2: [operator, value]
- array of length 2: [value1, value2]
- array of length 4: [operator1, value1, operator2, value2]

```
{
  merchants: {
    $where: {
      availability: true, // merchant.availability === true
      hot: ['>=', 100], // merchant.hot >= 100
      price: [100, 200], // merchant.price in [100, 200]
      deliveryFee: ['>=', 100, '<', 200], // merchant.deliveryFee in [100, 200)
      createdAt: ['>=', '2017-01-01T00:00:000Z'], // created in or after 2017
    },
  },
}
```

##### $orderBy
$orderBy defines the order of documents. It can also act as a filter, but we should use $where if we just need a filter. All its properties should be objects, which contains:
- $order: 'asc'(default) or 'desc'.
- $startAt: >= value.
- $endAt: <= value.
- $startAfter: > value.
- $endBefore: < value.
- $limit: limit the number of documents.

```
{
  merchants: {
    $orderBy: {
      createdAt: {
        $order: 'desc',
        $startAt: '2017-01-01T00:00:000Z',
        $limit: 5,
      }, // Find the last 5 (at most) merchants that created in or after 2017.
    },
  },
}
```

##### $forEach
In database we always store id of sub-items, but when we use items in view, we need the data of sub-items rather than just id. Then we need to use $forEach.

$forEach can be a function or a **container** node.

- Function: data => sub-schema. The argument will be data of a **single document**, and the function should generate the sub-schema for next round listening.
- Container node: all its properties must be functions (dataL, data) => sub-schema. The dataL is **document[key]**, and the data is **document**. It should generate the sub-schema for the key. It's similar to **document** node (in **$id** part). In fact, $forEach is to deal with all single documents of a queried collection.

```
{
  merchants: {
    $forEach: {
      location: locationId => ({
        $id: locationId,
      }), // Valid, $coll will be 'locations'
    },
  },
}
```
All merchants' locations will have detailed data.
```
{
  merchants: {
    $forEach: merchant => ({
      $coll: 'merchants', // This time $coll cannot be left, because the key of schema is id
      $id: merchant.objectId,
    }),
  },
}
```
All merchants will be re-fetched. (Just an example, it's wasting. But in other cases it might be useful, especially for an id list)

##### Combination
```
{
  merchants: {
    $where: {
      availability: true,
    },
    $forEach: {
      campaignRules: (unused, merchant) => ({
        $where: {
          merchant: merchant.objectId,
          avail: true,
        },
        $forEach: {
          locations: (ids) => {
            if (typeof ids === 'string') {
              return {
                $coll: 'locations',
                $id: ids,
              };
            } else {
              return _.map(ids, id => ({
                $coll: 'locations',
                $id: id,
              }));
            }
          },
        },
      }),
    },
  },
}
```
Fetch all available merchants, and get it's campaign rules with detailed locations.

## Update Data (Thinking)

## Actions

All request will be dealed by actions.
```
import { actions as dataActions } from 'store/data';
```

### listen(schema, callback)

Listen on a schema, and trigger callback when any changes happen.

### Catch(schema, callback)

Listen on a schema in data store, and trigger callback when any changes happen.
