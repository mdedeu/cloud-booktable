class RestaurantRepository:

    def get_restaurant(self, restaurant_id):
        return self.db.get_restaurant(restaurant_id)

    def create_restaurant(self, restaurant):
        return self.db.create_restaurant(restaurant)

    def update_restaurant_link(self, restaurant_id, link):
        return self.db.update_restaurant_link(restaurant_id, link)

