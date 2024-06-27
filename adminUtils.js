const admins = [144824294]; // Replace with your ID

function addAdminById(userId) {
  if (!admins.includes(userId)) {
    admins.push(userId);
    return `User with ID ${userId} has been added as an administrator.`;
  } else {
    return `User with ID ${userId} is already an administrator.`;
  }
}

function removeAdminById(userId) {
  const index = admins.indexOf(userId);
  if (index > -1) {
    admins.splice(index, 1);
    return `User with ID ${userId} has been removed from administrators.`;
  } else {
    return `User with ID ${userId} is not an administrator.`;
  }
}

module.exports = {
  addAdminById,
  removeAdminById
};
