package com.smartlostfound.Matching.repository;

import com.smartlostfound.Matching.entity.Item;
import com.smartlostfound.Matching.entity.ItemStatus;
import com.smartlostfound.Matching.entity.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByTypeAndStatus(ItemType type, ItemStatus status);

    List<Item> findByTypeAndStatusIn(ItemType type, Collection<ItemStatus> statuses);

    List<Item> findByTypeAndStatusNot(ItemType type, ItemStatus status);

    List<Item> findByStatus(ItemStatus status);

    List<Item> findByUserId(Long userId);

    List<Item> findByType(ItemType type);
}
