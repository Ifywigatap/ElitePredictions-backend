export class User {
  constructor({ 
    uid, 
    email, 
    name = '', 
    role = 'user', 
    isVip = false, 
    vipExpiry = null, 
    createdAt = new Date() 
  }) {
    this.uid = uid;
    this.email = email;
    this.name = name;
    this.role = role;
    this.isVip = isVip;
    this.vipExpiry = vipExpiry;
    this.createdAt = createdAt;
  }

  toFirestore() {
    return {
      email: this.email,
      name: this.name,
      role: this.role,
      isVip: this.isVip,
      vipExpiry: this.vipExpiry,
      createdAt: this.createdAt,
    };
  }
}