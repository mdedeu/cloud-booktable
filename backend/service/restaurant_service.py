from persistance.restaurant_repository import RestaurantRepository


class RestaurantService:
    def __init__(self):
        self.repository = RestaurantRepository()
    def add_link_to_restaurant(self, restaurant_id, link):
        return self.repository.update_restaurant_link(restaurant_id, link)