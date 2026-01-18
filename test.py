new = "postgresql://pimpmycase_user:fsczh3W908EQpEXu9GdoOHElvxvqFpL3@dpg-d2io84buibrs73a2ngkg-a.oregon-postgres.render.com/pimpmycase_db_puu4"
new_internal = "postgresql://pimpmycase_user:fsczh3W908EQpEXu9GdoOHElvxvqFpL3@dpg-d2io84buibrs73a2ngkg-a/pimpmycase_db_puu4"

old = "postgresql://pimpmycase_user:fsczh3W908EQpEXu9GdoOHElvxvqFpL3@dpg-d2io4buibrs73a2ngkg-a.oregon-postgres.render.com/pimpmycase_db_puu4"
old_on_pimpmycase = "postgresql://pimpmycase_user:fsczh3W908EQpEXu9GdoOHElvxvqFpL3@dpg-d2io84buibrs73a2ngkg-a.oregon-postgres.render.com/pimpmycase_db_puu4"

if old_on_pimpmycase == new:
    print("old_on_pimpmycase == new")
elif old_on_pimpmycase == new_internal:
    print("old_on_pimpmycase == new_internal")
elif old == new:
    print("old == new")
elif old == new_internal:
    print("old == new_internal")
else:
    print("no match")