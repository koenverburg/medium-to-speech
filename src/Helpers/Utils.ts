export class Util {
  public static getUserObject(references: any) {

    // References and the User, Collection, Social objects inside
    // are build using the following schema
    // references: {
    //   User: { // Or Collection, Social
    //      "<base64 string capped to 11 characters>" : {
    //        ...object
    //    }
    //   }
    // }

    const userReference = references['User']
    const userId = Object.keys(userReference)[0]
    return userReference[userId]
  }
}