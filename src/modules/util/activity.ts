import {
  Activity
} from 'eris'

export const activitiesAreEqual = (
  activities: Array<Array<Activity>>
): boolean => {
  const [
    first,
    ...rest
  ] = activities

  return rest.every((acts) => acts.length === first.length) &&
    rest.every((acts) => acts.every(({
      created_at: newCreatedAt,
      name: newName
    }, i) => {
      const {
        created_at: oldCreatedAt,
        name: oldName
      } = first[i]

      return newName === oldName && newCreatedAt === oldCreatedAt
    }))
}
