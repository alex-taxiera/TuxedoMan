import {
  Activity,
} from 'eris'

export const activitiesAreEqual = (
  activities: Array<Array<Activity>>,
): boolean => {
  const [
    first,
    ...rest
  ] = activities

  return rest.every((acts) => acts.length === first.length) &&
    rest.every((acts) => acts.every(({
      created_at: newCreatedAt,
      name: newName,
      details: newDetails,
      state: newState,
    }, i) => {
      const {
        created_at: oldCreatedAt,
        name: oldName,
        details: oldDetails,
        state: oldState,
      } = first[i]

      return (newName === oldName && newCreatedAt === oldCreatedAt) ||
        (
          newName === 'Spotify' &&
          newDetails === oldDetails && newState === oldState
        )
    }))
}
