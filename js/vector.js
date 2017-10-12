function Vector(x, y) {
  this.x = x;
  this.y = y;
}

Vector.prototype.add = function(vector) {
  return new Vector(this.x + vector.x, this.y + vector.y);
};

Vector.prototype.minus = function(vector) {
  return new Vector(this.x - vector.x, this.y - vector.y);
};

Vector.prototype.multiply = function(factor) {
  return new Vector(this.x * factor, this.y * factor);
};

Vector.prototype.normal = function() {
  return new Vector(this.y, -this.x);
};

Vector.prototype.normalize = function() {
  if (this.length == 0) {
    return new Vector(0, 0);
  } else {
    return new Vector(this.x / this.length(), this.y / this.length());
  }
};

Vector.prototype.length = function() {
  return Math.sqrt(sqr(this.x) + sqr(this.y));
};

Vector.prototype.toString = function() {
  return this.x + "," + this.y;
}
