package com.banking.accountservice.repository;

import com.banking.accountservice.model.Account;
import com.banking.accountservice.model.AccountStatus;
import com.banking.accountservice.model.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {
    Optional<Account> findByAccountNumber(String accountNumber);
    java.util.List<Account> findByUserId(String userId);
    java.util.List<Account> findByEmail(String email);
    boolean existsByAccountNumber(String accountNumber);
    boolean existsByEmail(String email);
    boolean existsByUserIdAndAccountType(String userId, AccountType accountType);
    boolean existsByEmailAndAccountType(String email, AccountType accountType);
    boolean existsByUserIdAndAccountTypeAndStatus(String userId, AccountType accountType, AccountStatus status);
    boolean existsByEmailAndAccountTypeAndStatus(String email, AccountType accountType, AccountStatus status);
}
